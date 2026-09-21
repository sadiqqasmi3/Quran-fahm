import { MemoryRepository } from "@quran-feham/database";
import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { MemoryAuthMailer } from "./mailer.js";
import { signAccessToken, verifyAccessToken } from "./security.js";

const allowedOrigin = "http://localhost:3000";
const testSecrets = {
  jwtSecret: "test-jwt-secret-with-at-least-thirty-two-characters",
  refreshTokenPepper: "test-refresh-pepper-with-at-least-thirty-two-characters",
  otpPepper: "test-otp-pepper-with-at-least-thirty-two-characters",
};

function config(overrides = {}) {
  return loadConfig(
    { NODE_ENV: "test" },
    {
      ...testSecrets,
      requireOrigin: true,
      allowedOrigins: new Set([allowedOrigin]),
      exposeDevelopmentCodes: true,
      rateLimitMax: 100,
      ...overrides,
    },
  );
}

function cookiesFrom(headers: Record<string, string | string[] | number | undefined>): {
  header: string;
  access: string;
  refresh: string;
} {
  const raw = headers["set-cookie"];
  const combined = Array.isArray(raw) ? raw.join("\n") : raw === undefined ? "" : String(raw);
  const access = /(?:^|\n)qf_access=([^;]+)/.exec(combined)?.[1] ?? "";
  const refresh = /(?:^|\n)qf_refresh=([^;]+)/.exec(combined)?.[1] ?? "";
  return {
    access: decodeURIComponent(access),
    refresh: decodeURIComponent(refresh),
    header: `qf_access=${access}; qf_refresh=${refresh}`,
  };
}

const registration = {
  email: "learner@example.test",
  password: "SecurePassword9",
  displayName: "Learner",
  locale: "ur",
};

class ConcurrentRefreshRepository extends MemoryRepository {
  private currentLookups = 0;
  private releaseGate!: () => void;
  private readonly gate = new Promise<void>((resolve) => {
    this.releaseGate = resolve;
  });

  override async findSessionByRefreshTokenHash(hash: string) {
    const record = await super.findSessionByRefreshTokenHash(hash);
    if (record?.matched !== "current" || this.currentLookups >= 2) return record;
    this.currentLookups += 1;
    if (this.currentLookups === 2) this.releaseGate();
    await this.gate;
    return record;
  }
}

describe("Quran Feham auth API", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("registers, stores only a refresh digest, verifies email, and returns the current user", async () => {
    const repository = new MemoryRepository();
    const mailer = new MemoryAuthMailer();
    app = await buildApp({ config: config(), repository, mailer });

    const registered = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { origin: allowedOrigin, "user-agent": "Test browser" },
      payload: registration,
    });
    expect(registered.statusCode).toBe(201);
    expect(registered.json()).toMatchObject({
      user: { email: registration.email, emailVerified: false },
      verificationRequired: true,
    });
    const cookies = cookiesFrom(registered.headers);
    expect(cookies.access).not.toBe("");
    expect(cookies.refresh).not.toBe("");
    expect(String(registered.headers["set-cookie"])).toContain("HttpOnly");
    expect(String(registered.headers["set-cookie"])).toContain("SameSite=Lax");
    const storedSession = [...repository.sessions.values()][0];
    expect(storedSession?.refreshTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(storedSession?.refreshTokenHash).not.toBe(cookies.refresh);

    const me = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { cookie: cookies.header },
    });
    expect(me.statusCode).toBe(403);
    expect(me.json().code).toBe("EMAIL_VERIFICATION_REQUIRED");

    const code = mailer.latest(registration.email, "verify-email")?.code;
    expect(code).toMatch(/^\d{6}$/);
    const verified = await app.inject({
      method: "POST",
      url: "/api/v1/auth/verify-email",
      headers: { origin: allowedOrigin },
      payload: { email: registration.email, code },
    });
    expect(verified.statusCode).toBe(200);
    expect(verified.json().user.emailVerified).toBe(true);

    const verifiedMe = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { cookie: cookies.header },
    });
    expect(verifiedMe.statusCode).toBe(200);
    expect(verifiedMe.json().user.email).toBe(registration.email);

    const savedSettings = await app.inject({
      method: "PUT",
      url: "/api/v1/users/settings",
      headers: { origin: allowedOrigin, cookie: cookies.header },
      payload: {
        locale: "en",
        translationEditionId: "en.sahih",
        recitationEditionId: "ar.alafasy",
        dailyMinutes: 15,
        theme: "dark",
        arabicScale: 1.2,
      },
    });
    expect(savedSettings.statusCode).toBe(200);
    expect(savedSettings.json()).toMatchObject({
      locale: "en",
      translationEditionId: "en.sahih",
      recitationEditionId: "ar.alafasy",
      dailyMinutes: 15,
      theme: "dark",
    });

    const unsupportedSettings = await app.inject({
      method: "PUT",
      url: "/api/v1/users/settings",
      headers: { origin: allowedOrigin, cookie: cookies.header },
      payload: {
        locale: "en",
        translationEditionId: "unreviewed.translation",
        recitationEditionId: "unreviewed.reciter",
        dailyMinutes: 15,
        theme: "dark",
        arabicScale: 1.2,
      },
    });
    expect(unsupportedSettings.statusCode).toBe(400);

    const savedPosition = await app.inject({
      method: "PUT",
      url: "/api/v1/users/reading-position",
      headers: { origin: allowedOrigin, cookie: cookies.header },
      payload: { surahNumber: 2, ayahNumber: 255, mode: "study" },
    });
    expect(savedPosition.statusCode).toBe(200);
    expect(savedPosition.json()).toMatchObject({
      surahNumber: 2,
      ayahNumber: 255,
      mode: "study",
    });

    const impossiblePosition = await app.inject({
      method: "PUT",
      url: "/api/v1/users/reading-position",
      headers: { origin: allowedOrigin, cookie: cookies.header },
      payload: { surahNumber: 1, ayahNumber: 8, mode: "read" },
    });
    expect(impossiblePosition.statusCode).toBe(400);
    expect(impossiblePosition.json().fieldErrors.ayahNumber).toBeDefined();

    const currentPosition = await app.inject({
      method: "GET",
      url: "/api/v1/users/reading-position",
      headers: { cookie: cookies.header },
    });
    expect(currentPosition.statusCode).toBe(200);
    expect(currentPosition.json().position).toMatchObject({ surahNumber: 2, ayahNumber: 255 });

    const reusedCode = await app.inject({
      method: "POST",
      url: "/api/v1/auth/verify-email",
      headers: { origin: allowedOrigin },
      payload: { email: registration.email, code },
    });
    expect(reusedCode.statusCode).toBe(400);
    expect(reusedCode.json().code).toBe("INVALID_OR_EXPIRED_CODE");
  });

  it("does not authenticate an unverified password login and sends a fresh OTP", async () => {
    const repository = new MemoryRepository();
    const mailer = new MemoryAuthMailer();
    app = await buildApp({ config: config(), repository, mailer });
    const registered = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { origin: allowedOrigin },
      payload: registration,
    });
    const registrationCookies = cookiesFrom(registered.headers);
    const firstCode = mailer.latest(registration.email, "verify-email")?.code;

    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { origin: allowedOrigin },
      payload: { email: registration.email, password: registration.password },
    });
    expect(login.statusCode).toBe(403);
    expect(login.json().code).toBe("EMAIL_VERIFICATION_REQUIRED");
    expect(login.headers["set-cookie"]).toBeUndefined();
    expect(mailer.latest(registration.email, "verify-email")?.code).not.toBe(firstCode);

    const resend = await app.inject({
      method: "POST",
      url: "/api/v1/auth/resend-verification",
      headers: { origin: allowedOrigin },
      payload: { email: registration.email },
    });
    expect(resend.statusCode).toBe(202);

    const unknownResend = await app.inject({
      method: "POST",
      url: "/api/v1/auth/resend-verification",
      headers: { origin: allowedOrigin },
      payload: { email: "unknown@example.test" },
    });
    expect(unknownResend.statusCode).toBe(202);

    const refresh = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      headers: { origin: allowedOrigin, cookie: `qf_refresh=${registrationCookies.refresh}` },
    });
    expect(refresh.statusCode).toBe(403);
    expect(refresh.json().code).toBe("EMAIL_VERIFICATION_REQUIRED");
  });

  it("atomically consumes an OTP after the maximum number of concurrent failures", async () => {
    const repository = new MemoryRepository();
    const mailer = new MemoryAuthMailer();
    app = await buildApp({ config: config({ otpMaxAttempts: 5 }), repository, mailer });
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { origin: allowedOrigin },
      payload: registration,
    });
    const code = mailer.latest(registration.email, "verify-email")?.code;
    const wrongCode = code === "000000" ? "111111" : "000000";
    const runningApp = app;

    const failures = await Promise.all(
      Array.from({ length: 10 }, () =>
        runningApp.inject({
          method: "POST",
          url: "/api/v1/auth/verify-email",
          headers: { origin: allowedOrigin },
          payload: { email: registration.email, code: wrongCode },
        }),
      ),
    );
    expect(failures.every((response) => response.statusCode === 400)).toBe(true);

    const afterLimit = await app.inject({
      method: "POST",
      url: "/api/v1/auth/verify-email",
      headers: { origin: allowedOrigin },
      payload: { email: registration.email, code },
    });
    expect(afterLimit.statusCode).toBe(400);
    expect(afterLimit.json().code).toBe("INVALID_OR_EXPIRED_CODE");
  });

  it("rotates refresh tokens and revokes the token family when a rotated token is reused", async () => {
    const repository = new MemoryRepository();
    const mailer = new MemoryAuthMailer();
    app = await buildApp({
      config: config(),
      repository,
      mailer,
    });
    const registered = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { origin: allowedOrigin },
      payload: registration,
    });
    const first = cookiesFrom(registered.headers);
    const code = mailer.latest(registration.email, "verify-email")?.code;
    const verified = await app.inject({
      method: "POST",
      url: "/api/v1/auth/verify-email",
      headers: { origin: allowedOrigin },
      payload: { email: registration.email, code },
    });
    expect(verified.statusCode).toBe(200);

    const refreshed = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      headers: { origin: allowedOrigin, cookie: `qf_refresh=${first.refresh}` },
    });
    expect(refreshed.statusCode).toBe(200);
    const second = cookiesFrom(refreshed.headers);
    expect(second.refresh).not.toBe(first.refresh);

    const refreshedAgain = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      headers: { origin: allowedOrigin, cookie: `qf_refresh=${second.refresh}` },
    });
    expect(refreshedAgain.statusCode).toBe(200);
    const third = cookiesFrom(refreshedAgain.headers);
    expect(third.refresh).not.toBe(second.refresh);

    const replay = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      headers: { origin: allowedOrigin, cookie: `qf_refresh=${first.refresh}` },
    });
    expect(replay.statusCode).toBe(401);
    expect(replay.json().code).toBe("REFRESH_TOKEN_REUSE");
    expect(String(replay.headers["set-cookie"])).toContain("Max-Age=0");

    const afterReplay = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      headers: { origin: allowedOrigin, cookie: `qf_refresh=${third.refresh}` },
    });
    expect(afterReplay.statusCode).toBe(401);
    expect([...repository.sessions.values()][0]?.revokedAt).toBeInstanceOf(Date);
  });

  it("revokes the token family when concurrent refreshes race after the same lookup", async () => {
    const repository = new ConcurrentRefreshRepository();
    const mailer = new MemoryAuthMailer();
    app = await buildApp({ config: config(), repository, mailer });
    const registered = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { origin: allowedOrigin },
      payload: registration,
    });
    const first = cookiesFrom(registered.headers);
    const code = mailer.latest(registration.email, "verify-email")?.code;
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/verify-email",
      headers: { origin: allowedOrigin },
      payload: { email: registration.email, code },
    });

    const attempts = await Promise.all([
      app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        headers: { origin: allowedOrigin, cookie: `qf_refresh=${first.refresh}` },
      }),
      app.inject({
        method: "POST",
        url: "/api/v1/auth/refresh",
        headers: { origin: allowedOrigin, cookie: `qf_refresh=${first.refresh}` },
      }),
    ]);

    expect(attempts.map((response) => response.statusCode).sort()).toEqual([200, 401]);
    expect(attempts.find((response) => response.statusCode === 401)?.json().code).toBe(
      "REFRESH_TOKEN_REUSE",
    );
    expect([...repository.sessions.values()][0]?.revokedAt).toBeInstanceOf(Date);
  });

  it("rejects a hostile origin and handles malformed cookies as unauthenticated", async () => {
    app = await buildApp({ config: config() });
    const hostile = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { origin: "https://evil.example" },
      payload: registration,
    });
    expect(hostile.statusCode).toBe(403);
    expect(hostile.json().code).toBe("ORIGIN_NOT_ALLOWED");

    const malformed = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { cookie: "qf_access=%E0%A4%A" },
    });
    expect(malformed.statusCode).toBe(401);
    expect(malformed.json().code).toBe("UNAUTHENTICATED");
  });

  it("rate limits repeated auth mutations", async () => {
    app = await buildApp({
      config: config({ rateLimitMax: 1 }),
      mailer: new MemoryAuthMailer(),
    });
    const first = await app.inject({
      method: "POST",
      url: "/api/v1/auth/forgot-password",
      headers: { origin: allowedOrigin },
      payload: { email: registration.email },
    });
    const second = await app.inject({
      method: "POST",
      url: "/api/v1/auth/forgot-password",
      headers: { origin: allowedOrigin },
      payload: { email: registration.email },
    });
    expect(first.statusCode).toBe(202);
    expect(second.statusCode).toBe(429);
  });

  it("resets a password, invalidates existing sessions, and accepts only the new password", async () => {
    const mailer = new MemoryAuthMailer();
    app = await buildApp({ config: config(), mailer });
    const registered = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      headers: { origin: allowedOrigin },
      payload: registration,
    });
    const oldCookies = cookiesFrom(registered.headers);
    const verificationCode = mailer.latest(registration.email, "verify-email")?.code;
    const verified = await app.inject({
      method: "POST",
      url: "/api/v1/auth/verify-email",
      headers: { origin: allowedOrigin },
      payload: { email: registration.email, code: verificationCode },
    });
    expect(verified.statusCode).toBe(200);
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/forgot-password",
      headers: { origin: allowedOrigin },
      payload: { email: registration.email },
    });
    const code = mailer.latest(registration.email, "reset-password")?.code;
    const reset = await app.inject({
      method: "POST",
      url: "/api/v1/auth/reset-password",
      headers: { origin: allowedOrigin },
      payload: {
        email: registration.email,
        code,
        password: "DifferentPassword7",
      },
    });
    expect(reset.statusCode).toBe(200);

    const oldSession = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { cookie: oldCookies.header },
    });
    expect(oldSession.statusCode).toBe(401);

    const oldPassword = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { origin: allowedOrigin },
      payload: { email: registration.email, password: registration.password },
    });
    expect(oldPassword.statusCode).toBe(401);
    const newPassword = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { origin: allowedOrigin },
      payload: { email: registration.email, password: "DifferentPassword7" },
    });
    expect(newPassword.statusCode).toBe(200);
  });

  it("searches Arabic through the canonical edition and validates the query", async () => {
    const searches: Array<{ query: string; edition: string }> = [];
    app = await buildApp({
      config: config(),
      quranProvider: {
        listSurahs: async () => [],
        getSurah: async () => {
          throw new Error("not used");
        },
        search: async (query, edition) => {
          searches.push({ query, edition });
          return { count: 0, edition, matches: [] };
        },
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/quran/search?q=%D8%B1%D8%AD%D9%85%D8%A9&translationEdition=ur.jalandhry",
    });
    expect(response.statusCode).toBe(200);
    expect(searches).toEqual([{ query: "رحمة", edition: "quran-uthmani" }]);

    const invalid = await app.inject({ method: "GET", url: "/api/v1/quran/search?q=x" });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json().fieldErrors.q).toBeDefined();
  });

  it("searches non-Arabic text only through an allowed translation edition", async () => {
    const searches: Array<{ query: string; edition: string }> = [];
    app = await buildApp({
      config: config(),
      quranProvider: {
        listSurahs: async () => [],
        getSurah: async () => {
          throw new Error("not used");
        },
        search: async (query, edition) => {
          searches.push({ query, edition });
          return { count: 0, edition, matches: [] };
        },
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/quran/search?q=mercy&translationEdition=en.sahih",
    });
    expect(response.statusCode).toBe(200);
    expect(searches).toEqual([{ query: "mercy", edition: "en.sahih" }]);

    const explicitUrdu = await app.inject({
      method: "GET",
      url: "/api/v1/quran/search?q=%D8%B1%D8%AD%D9%85%D8%AA&translationEdition=ur.jalandhry&scope=translation",
    });
    expect(explicitUrdu.statusCode).toBe(200);
    expect(searches.at(-1)).toEqual({ query: "رحمت", edition: "ur.jalandhry" });

    const unsupported = await app.inject({
      method: "GET",
      url: "/api/v1/quran/search?q=mercy&translationEdition=made.up",
    });
    expect(unsupported.statusCode).toBe(400);
    expect(unsupported.json().fieldErrors.translationEdition).toBeDefined();
  });
});

describe("access token expiry", () => {
  it("rejects a correctly signed but expired JWT", async () => {
    const issued = await signAccessToken(
      {
        sub: "50d298ba-a30f-477d-9d11-035e60c9a7b8",
        sid: "1cd348c0-01fc-40dd-8104-56f73ea63e43",
        email: "learner@example.test",
        role: "LEARNER",
        verified: true,
        jti: "f5de1b66-326f-4c4d-8c20-ad5c88b026ff",
      },
      {
        secret: testSecrets.jwtSecret,
        issuer: "quran-feham-api",
        audience: "quran-feham-web",
        ttlSeconds: 1,
        now: new Date("2026-09-20T00:00:00.000Z"),
      },
    );
    const verified = await verifyAccessToken(issued.token, {
      secret: testSecrets.jwtSecret,
      issuer: "quran-feham-api",
      audience: "quran-feham-web",
      now: new Date("2026-09-20T00:00:02.000Z"),
    });
    expect(verified).toBeNull();
  });
});
