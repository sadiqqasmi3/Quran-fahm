import {
  ApiErrorSchema,
  AuthResultSchema,
  AuthSessionSchema,
  ForgotPasswordInputSchema,
  LoginInputSchema,
  ReadingPositionInputSchema,
  ReadingPositionSchema,
  RecitationEditionIdSchema,
  RegisterInputSchema,
  ResetPasswordInputSchema,
  TranslationEditionIdSchema,
  UserSchema,
  UserSettingsSchema,
  VerifyEmailInputSchema,
} from "@quran-feham/contracts";
import {
  KhatmRepositoryError,
  MemoryRepository,
  type QuranFehamRepository,
  RepositoryConflictError,
} from "@quran-feham/database";
import { AlQuranCloudProvider, QuranProviderError } from "@quran-feham/quran-provider";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { type ZodType, z } from "zod";
import { AuthService, type IssuedAuth } from "./auth-service.js";
import { type ApiConfig, loadConfig } from "./config.js";
import { ApiError } from "./errors.js";
import { registerKhatmRoutes } from "./khatm-routes.js";
import { type AuthMailer, createRuntimeAuthMailer } from "./mailer.js";
import { parseCookies, serializeCookie } from "./security.js";

interface QuranProvider {
  listSurahs: AlQuranCloudProvider["listSurahs"];
  getSurah: AlQuranCloudProvider["getSurah"];
  search: AlQuranCloudProvider["search"];
}

export interface BuildAppOptions {
  config?: ApiConfig;
  repository?: QuranFehamRepository;
  mailer?: AuthMailer;
  quranProvider?: QuranProvider;
  logger?: boolean;
}

interface RateBucket {
  count: number;
  resetsAt: number;
}

class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, RateBucket>();
  private readonly maximumBuckets = 10_000;

  constructor(
    private readonly maximum: number,
    private readonly windowMs: number,
  ) {}

  consume(key: string, now = Date.now()): void {
    const existing = this.buckets.get(key);
    if (!existing || existing.resetsAt <= now) {
      if (!existing && this.buckets.size >= this.maximumBuckets) {
        for (const [bucketKey, bucket] of this.buckets) {
          if (bucket.resetsAt <= now) this.buckets.delete(bucketKey);
        }
        while (this.buckets.size >= this.maximumBuckets) {
          const oldestKey = this.buckets.keys().next().value as string | undefined;
          if (!oldestKey) break;
          this.buckets.delete(oldestKey);
        }
      }
      this.buckets.set(key, { count: 1, resetsAt: now + this.windowMs });
      return;
    }
    existing.count += 1;
    if (existing.count > this.maximum) {
      throw new ApiError(429, "RATE_LIMITED", "Too many attempts. Please try again later");
    }
  }
}

const SessionIdSchema = z.string().uuid();
const QuranQuerySchema = z.object({
  translationEdition: TranslationEditionIdSchema.default("ur.jalandhry"),
  recitationEdition: RecitationEditionIdSchema.default("ar.alafasy"),
});
const QuranSearchQuerySchema = z.object({
  q: z.string().trim().min(2, "Enter at least 2 characters").max(100),
  translationEdition: TranslationEditionIdSchema.default("ur.jalandhry"),
  scope: z.enum(["auto", "arabic", "translation"]).default("auto"),
});

function parseWithSchema<T>(schema: ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_form";
    fieldErrors[key] ??= [];
    fieldErrors[key].push(issue.message);
  }
  throw new ApiError(
    400,
    "VALIDATION_FAILED",
    "Please correct the highlighted fields",
    fieldErrors,
  );
}

function requestCookies(request: FastifyRequest, config: ApiConfig) {
  const cookies = parseCookies(request.headers.cookie);
  return {
    accessToken: cookies[config.accessCookieName],
    refreshToken: cookies[config.refreshCookieName],
  };
}

function authContext(request: FastifyRequest) {
  const userAgent = request.headers["user-agent"];
  return {
    ipAddress: request.ip,
    ...(typeof userAgent === "string" ? { userAgent } : {}),
  };
}

function setAuthCookies(reply: FastifyReply, issued: IssuedAuth, config: ApiConfig): void {
  reply.header("set-cookie", [
    serializeCookie(config.accessCookieName, issued.accessToken, {
      path: "/",
      httpOnly: true,
      secure: config.secureCookies,
      sameSite: "Lax",
      maxAge: config.accessTtlSeconds,
      expires: issued.accessExpiresAt,
    }),
    serializeCookie(config.refreshCookieName, issued.refreshToken, {
      path: "/api/v1/auth",
      httpOnly: true,
      secure: config.secureCookies,
      sameSite: "Lax",
      maxAge: config.refreshTtlSeconds,
      expires: issued.refreshExpiresAt,
    }),
  ]);
}

function clearAuthCookies(reply: FastifyReply, config: ApiConfig): void {
  const expired = new Date(0);
  reply.header("set-cookie", [
    serializeCookie(config.accessCookieName, "", {
      path: "/",
      httpOnly: true,
      secure: config.secureCookies,
      sameSite: "Lax",
      maxAge: 0,
      expires: expired,
    }),
    serializeCookie(config.refreshCookieName, "", {
      path: "/api/v1/auth",
      httpOnly: true,
      secure: config.secureCookies,
      sameSite: "Lax",
      maxAge: 0,
      expires: expired,
    }),
  ]);
}

function required(value: string | undefined, code: string, message: string): string {
  if (!value) throw new ApiError(401, code, message);
  return value;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? loadConfig();
  if (config.environment === "production" && !options.repository) {
    throw new Error("A production repository must be provided to buildApp");
  }
  const repository = options.repository ?? new MemoryRepository();
  const mailer = options.mailer ?? createRuntimeAuthMailer(config);
  const quranProvider = options.quranProvider ?? new AlQuranCloudProvider();
  const auth = new AuthService(repository, mailer, config);
  const limiter = new FixedWindowRateLimiter(config.rateLimitMax, config.rateLimitWindowMs);
  const app = Fastify({ logger: options.logger ?? false, trustProxy: config.trustProxy });

  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;
    const isAllowedOrigin = typeof origin === "string" && config.allowedOrigins.has(origin);
    if (isAllowedOrigin) {
      reply.header("access-control-allow-origin", origin);
      reply.header("access-control-allow-credentials", "true");
      reply.header("vary", "Origin");
    }

    if (request.method === "OPTIONS") {
      if (!isAllowedOrigin) {
        throw new ApiError(403, "ORIGIN_NOT_ALLOWED", "This origin is not allowed");
      }
      reply.header("access-control-allow-methods", "GET, POST, PUT, DELETE, OPTIONS");
      reply.header("access-control-allow-headers", "content-type");
      return reply.code(204).send();
    }

    const unsafeMethod = !["GET", "HEAD"].includes(request.method);
    if (unsafeMethod && (origin ? !isAllowedOrigin : config.requireOrigin)) {
      throw new ApiError(403, "ORIGIN_NOT_ALLOWED", "This origin is not allowed");
    }

    if (request.url.startsWith("/api/v1/khatm/")) {
      reply.header("cache-control", "no-store");
      if (unsafeMethod) {
        const route = request.url.split("?", 1)[0] ?? request.url;
        limiter.consume(`${request.ip}:${route}`);
      }
    }

    if (unsafeMethod && request.url.startsWith("/api/v1/auth/")) {
      const route = request.url.split("?", 1)[0] ?? request.url;
      limiter.consume(`${request.ip}:${route}`);
      reply.header("cache-control", "no-store");
    }
  });

  app.setErrorHandler((error, request, reply) => {
    let apiError: ApiError;
    if (error instanceof ApiError) {
      apiError = error;
    } else if (error instanceof KhatmRepositoryError) {
      const mapped = {
        ROOM_NOT_FOUND: [404, "KHATM_ROOM_NOT_FOUND", "Khatm room not found"],
        NOT_MEMBER: [403, "KHATM_MEMBERSHIP_REQUIRED", "Join this Khatm room to continue"],
        NOT_OWNER: [403, "KHATM_OWNER_REQUIRED", "Only the room owner can make this change"],
        MEMBER_NOT_FOUND: [404, "KHATM_MEMBER_NOT_FOUND", "Room member not found"],
        OWNER_CANNOT_LEAVE: [409, "KHATM_OWNER_CANNOT_LEAVE", "The room owner cannot be removed"],
        CAMPAIGN_NOT_FOUND: [404, "KHATM_CAMPAIGN_NOT_FOUND", "Khatm campaign not found"],
        CAMPAIGN_NOT_READY: [409, "KHATM_CAMPAIGN_NOT_READY", "This campaign is not complete"],
        SLOT_NOT_FOUND: [404, "KHATM_SLOT_NOT_FOUND", "Para slot not found"],
        SLOT_UNAVAILABLE: [409, "KHATM_SLOT_UNAVAILABLE", "This Para has already been claimed"],
        NOT_CLAIMANT: [403, "KHATM_SLOT_NOT_ASSIGNED", "This Para is assigned to another member"],
        INVALID_SLOT_STATE: [409, "KHATM_SLOT_STATE_CONFLICT", "This Para cannot make that change"],
        ACTIVE_PARA_LIMIT: [409, "KHATM_ACTIVE_PARA_LIMIT", error.message],
        REMINDER_NOT_FOUND: [404, "KHATM_REMINDER_NOT_FOUND", "Khatm reminder not found"],
        REMINDER_STATE_CONFLICT: [409, "KHATM_REMINDER_STATE_CONFLICT", error.message],
      } as const;
      const [status, code, message] = mapped[error.code];
      apiError = new ApiError(status, code, message);
    } else if (error instanceof RepositoryConflictError) {
      apiError = new ApiError(409, "CONFLICT", error.message);
    } else if (error instanceof QuranProviderError) {
      apiError = new ApiError(503, "QURAN_PROVIDER_UNAVAILABLE", (error as Error).message);
    } else {
      request.log.error({ err: error }, "request failed");
      apiError = new ApiError(500, "INTERNAL_ERROR", "Something went wrong");
    }
    const body = ApiErrorSchema.parse({
      code: apiError.code,
      message: apiError.message,
      requestId: request.id,
      ...(apiError.fieldErrors ? { fieldErrors: apiError.fieldErrors } : {}),
    });
    return reply.code(apiError.statusCode).send(body);
  });

  app.get("/health", async () => ({ status: "ok" }));

  app.get("/ready", async () => {
    // This harmless query reaches the actual repository. In production it
    // fails when PostgreSQL is unavailable or migrations have not been applied.
    await repository.findContentRelease("__readiness_probe__");
    return { status: "ready" };
  });

  app.post("/api/v1/auth/register", async (request, reply) => {
    const input = parseWithSchema(RegisterInputSchema, request.body);
    const issued = await auth.register(input, authContext(request));
    setAuthCookies(reply, issued, config);
    return reply.code(201).send(AuthResultSchema.parse(issued.result));
  });

  app.post("/api/v1/auth/login", async (request, reply) => {
    const input = parseWithSchema(LoginInputSchema, request.body);
    const issued = await auth.login(input, authContext(request));
    setAuthCookies(reply, issued, config);
    return reply.send(AuthResultSchema.parse(issued.result));
  });

  app.get("/api/v1/auth/me", async (request) => {
    const { accessToken } = requestCookies(request, config);
    const authenticated = await auth.authenticate(
      required(accessToken, "UNAUTHENTICATED", "Please sign in to continue"),
    );
    return { user: UserSchema.parse(auth.userResponse(authenticated.user)) };
  });

  app.post("/api/v1/auth/refresh", async (request, reply) => {
    const { refreshToken } = requestCookies(request, config);
    try {
      const issued = await auth.refresh(
        required(refreshToken, "INVALID_SESSION", "Your session has expired. Please sign in again"),
      );
      setAuthCookies(reply, issued, config);
      return reply.send(AuthResultSchema.parse(issued.result));
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) clearAuthCookies(reply, config);
      throw error;
    }
  });

  app.post("/api/v1/auth/logout", async (request, reply) => {
    const cookies = requestCookies(request, config);
    await auth.logout(cookies.accessToken, cookies.refreshToken);
    clearAuthCookies(reply, config);
    return reply.send({ message: "Signed out" });
  });

  app.post("/api/v1/auth/verify-email", async (request) => {
    const input = parseWithSchema(VerifyEmailInputSchema, request.body);
    return { user: UserSchema.parse(await auth.verifyEmail(input)) };
  });

  app.post("/api/v1/auth/forgot-password", async (request, reply) => {
    const input = parseWithSchema(ForgotPasswordInputSchema, request.body);
    await auth.forgotPassword(input);
    return reply.code(202).send({
      message: "If an account exists for this email, a reset code has been sent",
    });
  });

  app.post("/api/v1/auth/resend-verification", async (request, reply) => {
    const input = parseWithSchema(ForgotPasswordInputSchema, request.body);
    await auth.resendVerification(input);
    return reply.code(202).send({
      message: "If this email is awaiting verification, a new code has been sent",
    });
  });

  app.post("/api/v1/auth/reset-password", async (request, reply) => {
    const input = parseWithSchema(ResetPasswordInputSchema, request.body);
    await auth.resetPassword(input);
    clearAuthCookies(reply, config);
    return reply.send({ message: "Password updated. Please sign in again" });
  });

  app.get("/api/v1/auth/sessions", async (request) => {
    const { accessToken } = requestCookies(request, config);
    const authenticated = await auth.authenticate(
      required(accessToken, "UNAUTHENTICATED", "Please sign in to continue"),
    );
    const sessions = await auth.listSessions(authenticated.user.id, authenticated.claims.sid);
    return { sessions: z.array(AuthSessionSchema).parse(sessions) };
  });

  app.delete<{ Params: { sessionId: string } }>(
    "/api/v1/auth/sessions/:sessionId",
    async (request, reply) => {
      const { accessToken } = requestCookies(request, config);
      const authenticated = await auth.authenticate(
        required(accessToken, "UNAUTHENTICATED", "Please sign in to continue"),
      );
      const sessionId = parseWithSchema(SessionIdSchema, request.params.sessionId);
      const revoked = await auth.revokeSession(sessionId, authenticated.user.id);
      if (!revoked) throw new ApiError(404, "SESSION_NOT_FOUND", "Session not found");
      if (sessionId === authenticated.claims.sid) clearAuthCookies(reply, config);
      return reply.send({ message: "Session revoked" });
    },
  );

  app.get("/api/v1/users/settings", async (request) => {
    const { accessToken } = requestCookies(request, config);
    const authenticated = await auth.authenticate(
      required(accessToken, "UNAUTHENTICATED", "Please sign in to continue"),
    );
    const preference =
      (await repository.findPreferences(authenticated.user.id)) ??
      (await repository.createDefaultPreferences(authenticated.user.id, authenticated.user.locale));
    return UserSettingsSchema.parse({
      locale: preference.interfaceLocale,
      translationEditionId: preference.translationEditionId,
      recitationEditionId: preference.recitationEditionId,
      dailyMinutes: preference.dailyGoalMinutes,
      theme: preference.theme.toLowerCase(),
      arabicScale: preference.arabicScale,
    });
  });

  app.put("/api/v1/users/settings", async (request) => {
    const { accessToken } = requestCookies(request, config);
    const authenticated = await auth.authenticate(
      required(accessToken, "UNAUTHENTICATED", "Please sign in to continue"),
    );
    const input = parseWithSchema(UserSettingsSchema, request.body);
    const preference = await repository.updatePreferences(authenticated.user.id, {
      interfaceLocale: input.locale,
      translationEditionId: input.translationEditionId,
      recitationEditionId: input.recitationEditionId,
      dailyGoalMinutes: input.dailyMinutes,
      theme: input.theme.toUpperCase() as "SYSTEM" | "LIGHT" | "DARK",
      arabicScale: input.arabicScale,
    });
    return UserSettingsSchema.parse({
      locale: preference.interfaceLocale,
      translationEditionId: preference.translationEditionId,
      recitationEditionId: preference.recitationEditionId,
      dailyMinutes: preference.dailyGoalMinutes,
      theme: preference.theme.toLowerCase(),
      arabicScale: preference.arabicScale,
    });
  });

  app.get("/api/v1/users/reading-position", async (request) => {
    const { accessToken } = requestCookies(request, config);
    const authenticated = await auth.authenticate(
      required(accessToken, "UNAUTHENTICATED", "Please sign in to continue"),
    );
    const position = await repository.findLatestReadingPosition(authenticated.user.id);
    return {
      position: position
        ? ReadingPositionSchema.parse({
            surahNumber: position.surahNumber,
            ayahNumber: position.ayahNumber,
            mode: position.mode,
            updatedAt: position.updatedAt.toISOString(),
          })
        : null,
    };
  });

  app.put("/api/v1/users/reading-position", async (request) => {
    const { accessToken } = requestCookies(request, config);
    const authenticated = await auth.authenticate(
      required(accessToken, "UNAUTHENTICATED", "Please sign in to continue"),
    );
    const input = parseWithSchema(ReadingPositionInputSchema, request.body);
    const position = await repository.saveReadingPosition({
      userId: authenticated.user.id,
      surahNumber: input.surahNumber,
      ayahNumber: input.ayahNumber,
      mode: input.mode,
    });
    return ReadingPositionSchema.parse({
      surahNumber: position.surahNumber,
      ayahNumber: position.ayahNumber,
      mode: position.mode,
      updatedAt: position.updatedAt.toISOString(),
    });
  });

  registerKhatmRoutes(app, {
    repository,
    requireUserId: async (request) => {
      const { accessToken } = requestCookies(request, config);
      const authenticated = await auth.authenticate(
        required(accessToken, "UNAUTHENTICATED", "Please sign in to continue"),
      );
      return authenticated.user.id;
    },
  });

  app.get("/api/v1/quran/surahs", async () => ({ surahs: await quranProvider.listSurahs() }));

  app.get<{ Querystring: Record<string, unknown> }>("/api/v1/quran/search", async (request) => {
    const query = parseWithSchema(QuranSearchQuerySchema, request.query);
    const useArabic =
      query.scope === "arabic" || (query.scope === "auto" && /[\u0600-\u06ff]/u.test(query.q));
    const edition = useArabic ? "quran-uthmani" : query.translationEdition;
    return quranProvider.search(query.q, edition);
  });

  app.get<{ Params: { number: string }; Querystring: Record<string, unknown> }>(
    "/api/v1/quran/surahs/:number",
    async (request) => {
      const number = Number(request.params.number);
      if (!Number.isInteger(number) || number < 1 || number > 114) {
        throw new ApiError(400, "INVALID_SURAH", "Surah must be an integer from 1 to 114");
      }
      const editions = parseWithSchema(QuranQuerySchema, request.query);
      return quranProvider.getSurah(number, editions);
    },
  );

  return app;
}
