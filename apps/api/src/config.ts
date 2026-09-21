const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

export type RuntimeEnvironment = "development" | "test" | "production";

export interface ApiConfig {
  environment: RuntimeEnvironment;
  host: string;
  port: number;
  databaseUrl?: string;
  jwtSecret: string;
  refreshTokenPepper: string;
  otpPepper: string;
  jwtIssuer: string;
  jwtAudience: string;
  accessCookieName: string;
  refreshCookieName: string;
  accessTtlSeconds: number;
  refreshTtlSeconds: number;
  otpTtlSeconds: number;
  otpMaxAttempts: number;
  secureCookies: boolean;
  requireOrigin: boolean;
  allowedOrigins: ReadonlySet<string>;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  genericAuthResponseMs: number;
  exposeAccessToken: boolean;
  exposeDevelopmentCodes: boolean;
  trustProxy: false | string;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    from: string;
    user?: string;
    password?: string;
    service?: string;
    appOrigin?: string;
  };
}

function integerEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function booleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "1" || value.toLowerCase() === "true";
}

function runtimeEnvironment(value: string | undefined): RuntimeEnvironment {
  if (value === undefined || value === "" || value === "development") return "development";
  if (value === "production" || value === "test") return value;
  throw new Error(`Unsupported NODE_ENV: ${value}`);
}

export function loadConfig(
  environment: NodeJS.ProcessEnv = process.env,
  overrides: Partial<ApiConfig> = {},
): ApiConfig {
  const runtime = runtimeEnvironment(environment.NODE_ENV);
  const allowedOrigins = new Set(
    (environment.ALLOWED_ORIGINS ?? DEFAULT_ALLOWED_ORIGINS.join(","))
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
  const jwtSecret = environment.JWT_SECRET ?? "development-only-change-this-jwt-secret";
  const refreshTokenPepper =
    environment.REFRESH_TOKEN_PEPPER ?? "development-only-change-this-refresh-pepper";
  const otpPepper = environment.OTP_PEPPER ?? "development-only-change-this-otp-pepper";
  const smtpHost = environment.SMTP_HOST?.trim() || (environment.SENDPULSE_SMTP_KEY ? "smtp-pulse.com" : undefined);
  const smtpFrom = environment.AUTH_EMAIL_FROM?.trim() || environment.SMTP_FROM?.trim() || '"Fehme Quran" <noreply@fehmequran.org>';
  const smtpUser = environment.SMTP_USER?.trim() || environment.SENDPULSE_SMTP_USER?.trim();
  const smtpPassword = environment.SMTP_PASSWORD ?? environment.SMTP_PASS ?? environment.SENDPULSE_SMTP_KEY;
  const smtpService = environment.SMTP_SERVICE?.trim();
  const rawAppOrigin =
    environment.NEXT_PUBLIC_APP_ORIGIN?.trim() ||
    environment.APP_ORIGIN?.trim() ||
    "https://fehmequran.org";
  const appOrigin =
    rawAppOrigin.includes("localhost") || rawAppOrigin.includes("127.0.0.1")
      ? "https://fehmequran.org"
      : rawAppOrigin;

  const config: ApiConfig = {
    environment: runtime,
    host: environment.HOST ?? "0.0.0.0",
    port: integerEnv(environment.PORT, 4000),
    ...(environment.DATABASE_URL ? { databaseUrl: environment.DATABASE_URL } : {}),
    jwtSecret,
    refreshTokenPepper,
    otpPepper,
    jwtIssuer: environment.JWT_ISSUER ?? "quran-feham-api",
    jwtAudience: environment.JWT_AUDIENCE ?? "quran-feham-web",
    accessCookieName: environment.ACCESS_COOKIE_NAME ?? "qf_access",
    refreshCookieName: environment.REFRESH_COOKIE_NAME ?? "qf_refresh",
    accessTtlSeconds: integerEnv(environment.ACCESS_TTL_SECONDS, 10 * 60),
    refreshTtlSeconds: integerEnv(environment.REFRESH_TTL_SECONDS, 30 * 24 * 60 * 60),
    otpTtlSeconds: integerEnv(environment.OTP_TTL_SECONDS, 10 * 60),
    otpMaxAttempts: integerEnv(environment.OTP_MAX_ATTEMPTS, 5),
    secureCookies: booleanEnv(environment.SECURE_COOKIES, runtime === "production"),
    requireOrigin: booleanEnv(environment.REQUIRE_ORIGIN, runtime === "production"),
    allowedOrigins,
    rateLimitMax: integerEnv(environment.AUTH_RATE_LIMIT_MAX, 20),
    rateLimitWindowMs: integerEnv(environment.AUTH_RATE_LIMIT_WINDOW_MS, 60_000),
    genericAuthResponseMs: integerEnv(
      environment.GENERIC_AUTH_RESPONSE_MS,
      runtime === "production" ? 750 : 1,
    ),
    exposeAccessToken: booleanEnv(environment.EXPOSE_ACCESS_TOKEN, false),
    exposeDevelopmentCodes: booleanEnv(
      environment.EXPOSE_DEVELOPMENT_CODES,
      runtime === "development",
    ),
    trustProxy: environment.TRUST_PROXY?.trim() || false,
    ...(smtpHost || smtpService
      ? {
          smtp: {
            host: smtpHost || "",
            port: integerEnv(environment.SMTP_PORT, environment.SMTP_SECURE === "true" || environment.SMTP_PORT === "465" ? 465 : 587),
            secure: booleanEnv(environment.SMTP_SECURE, environment.SMTP_PORT === "465"),
            from: smtpFrom || "Quran Feham <noreply@fehmequran.org>",
            ...(smtpUser ? { user: smtpUser } : {}),
            ...(smtpPassword ? { password: smtpPassword } : {}),
            ...(smtpService ? { service: smtpService } : {}),
            appOrigin,
          },
        }
      : {}),
    ...overrides,
  };
  if (config.environment === "production" && !config.databaseUrl) {
    throw new Error("DATABASE_URL is required in production");
  }
  if (config.environment === "production") {
    const secrets = [config.jwtSecret, config.refreshTokenPepper, config.otpPepper];
    if (
      secrets.some((secret) => secret.length < 32 || secret.startsWith("development-only")) ||
      new Set(secrets).size !== secrets.length
    ) {
      throw new Error("Production auth secrets must be unique and at least 32 characters");
    }
    if (!config.secureCookies) {
      throw new Error("SECURE_COOKIES cannot be disabled in production");
    }
    if (!config.requireOrigin) {
      throw new Error("REQUIRE_ORIGIN cannot be disabled in production");
    }
    if (config.exposeDevelopmentCodes) {
      throw new Error("EXPOSE_DEVELOPMENT_CODES cannot be enabled in production");
    }
    if (config.trustProxy === "true" || config.trustProxy === "*") {
      throw new Error("TRUST_PROXY must name trusted proxy networks, not trust every client");
    }
    if (!config.smtp) {
      throw new Error("SMTP_HOST and AUTH_EMAIL_FROM are required in production");
    }
    if (config.genericAuthResponseMs < 250) {
      throw new Error("GENERIC_AUTH_RESPONSE_MS must be at least 250 in production");
    }
    if (Boolean(config.smtp.user) !== Boolean(config.smtp.password)) {
      throw new Error("SMTP_USER and SMTP_PASSWORD must be configured together");
    }
  }
  return config;
}
