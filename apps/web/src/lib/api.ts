import {
  type AuthResult,
  AuthResultSchema,
  type SurahResponse,
  SurahResponseSchema,
  type SurahSummary,
  SurahSummarySchema,
  type User,
  UserSchema,
} from "@quran-feham/contracts";
import { z } from "zod";

export class ApiFailure extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly fieldErrors: Record<string, string[]> | undefined;

  constructor(
    message: string,
    status: number,
    code?: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiFailure";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

async function readJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  return response.json();
}

async function executeRequest(
  path: string,
  init: RequestInit,
): Promise<{
  response: Response;
  body: unknown;
}> {
  let response: Response;
  try {
    const fetchInit: RequestInit = {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    };
    if (!fetchInit.signal && typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
      fetchInit.signal = AbortSignal.timeout(8000);
    }
    response = await fetch(`/api/v1${path}`, fetchInit);
  } catch {
    throw new ApiFailure("The Quran Feham service is not reachable.", 0);
  }
  return { response, body: await readJson(response) };
}

function responseFailure(response: Response, body: unknown): ApiFailure {
  const failure = z
    .object({
      code: z.string().optional(),
      message: z.string().optional(),
      fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    })
    .safeParse(body);
  return new ApiFailure(
    failure.success && failure.data.message
      ? failure.data.message
      : "The request could not be completed.",
    response.status,
    failure.success ? failure.data.code : undefined,
    failure.success ? failure.data.fieldErrors : undefined,
  );
}

let refreshInFlight: Promise<void> | null = null;

async function refreshSession(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = executeRequest("/auth/refresh", { method: "POST" })
      .then(({ response, body }) => {
        if (!response.ok) throw responseFailure(response, body);
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export async function apiRequest(path: string, init: RequestInit = {}): Promise<unknown> {
  let result = await executeRequest(path, init);
  const refreshableAuthRead =
    path === "/auth/me" || path === "/auth/sessions" || path.startsWith("/auth/sessions/");
  if (result.response.status === 401 && (refreshableAuthRead || !path.startsWith("/auth/"))) {
    await refreshSession();
    result = await executeRequest(path, init);
  }
  const { response, body } = result;
  if (!response.ok) {
    throw responseFailure(response, body);
  }
  return body;
}

export async function login(payload: {
  email: string;
  password: string;
  deviceName?: string;
}): Promise<AuthResult> {
  return AuthResultSchema.parse(
    await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export async function register(payload: {
  email: string;
  password: string;
  displayName?: string;
  locale: "en" | "ur";
}): Promise<AuthResult> {
  return AuthResultSchema.parse(
    await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export async function getCurrentUser(): Promise<User> {
  const result = z.object({ user: UserSchema }).parse(await apiRequest("/auth/me"));
  return result.user;
}

export async function logout(): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST" });
}

export async function getSurahs(): Promise<SurahSummary[]> {
  const payload = await apiRequest("/quran/surahs");
  const wrapped = z.object({ surahs: z.array(SurahSummarySchema) }).safeParse(payload);
  if (wrapped.success) return wrapped.data.surahs;
  return z.array(SurahSummarySchema).parse(payload);
}

export async function getSurah(
  number: number,
  translationEdition = "ur.jalandhry",
  recitationEdition = "ar.alafasy",
): Promise<SurahResponse> {
  const query = new URLSearchParams({ translationEdition, recitationEdition });
  return SurahResponseSchema.parse(await apiRequest(`/quran/surahs/${number}?${query.toString()}`));
}

const QuranSearchMatchSchema = z.object({
  globalNumber: z.number().int().positive(),
  ayahNumber: z.number().int().positive(),
  text: z.string(),
  surah: SurahSummarySchema,
});

const QuranSearchResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  edition: z.string().min(1),
  matches: z.array(QuranSearchMatchSchema),
});

export type QuranSearchResponse = z.infer<typeof QuranSearchResponseSchema>;

export async function searchQuran(
  query: string,
  translationEdition = "ur.jalandhry",
  scope: "arabic" | "translation" | "auto" = "auto",
): Promise<QuranSearchResponse> {
  const search = new URLSearchParams({ q: query, translationEdition, scope });
  return QuranSearchResponseSchema.parse(await apiRequest(`/quran/search?${search.toString()}`));
}
