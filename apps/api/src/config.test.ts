import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

const productionEnvironment = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://quran_feham:test@localhost:5432/quran_feham",
  JWT_SECRET: "jwt-secret-that-is-at-least-thirty-two-characters",
  REFRESH_TOKEN_PEPPER: "refresh-pepper-that-is-at-least-thirty-two-characters",
  OTP_PEPPER: "otp-pepper-that-is-at-least-thirty-two-characters",
  SMTP_HOST: "smtp.example.test",
  AUTH_EMAIL_FROM: "Quran Feham <no-reply@example.test>",
};

describe("production auth configuration", () => {
  it("rejects misspelled runtime environments instead of enabling development defaults", () => {
    expect(() => loadConfig({ NODE_ENV: "prod" })).toThrow("Unsupported NODE_ENV");
  });

  it.each([
    ["SECURE_COOKIES", "false", "SECURE_COOKIES cannot be disabled"],
    ["REQUIRE_ORIGIN", "false", "REQUIRE_ORIGIN cannot be disabled"],
    ["EXPOSE_DEVELOPMENT_CODES", "true", "EXPOSE_DEVELOPMENT_CODES cannot be enabled"],
  ])("rejects %s=%s", (name, value, expectedMessage) => {
    expect(() => loadConfig({ ...productionEnvironment, [name]: value })).toThrow(expectedMessage);
  });

  it("rejects identical auth secrets, including values supplied as overrides", () => {
    const repeatedSecret = "same-secret-that-is-at-least-thirty-two-characters";
    expect(() =>
      loadConfig(productionEnvironment, {
        jwtSecret: repeatedSecret,
        refreshTokenPepper: repeatedSecret,
      }),
    ).toThrow("Production auth secrets must be unique");
  });

  it("accepts secure, distinct production auth settings", () => {
    const config = loadConfig(productionEnvironment);
    expect(config).toMatchObject({
      environment: "production",
      secureCookies: true,
      requireOrigin: true,
      exposeDevelopmentCodes: false,
      genericAuthResponseMs: 750,
    });
  });

  it("requires a meaningful generic auth response window in production", () => {
    expect(() => loadConfig({ ...productionEnvironment, GENERIC_AUTH_RESPONSE_MS: "100" })).toThrow(
      "GENERIC_AUTH_RESPONSE_MS must be at least 250",
    );
  });
});
