import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

export interface AccessTokenClaims {
  sub: string;
  sid: string;
  email: string;
  role: "LEARNER" | "REVIEWER" | "ADMIN";
  verified: boolean;
  jti: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

interface JwtOptions {
  secret: string;
  issuer: string;
  audience: string;
  ttlSeconds: number;
  now?: Date;
}

export async function signAccessToken(
  claims: Omit<AccessTokenClaims, "iat" | "exp" | "iss" | "aud">,
  options: JwtOptions,
): Promise<{ token: string; expiresAt: Date }> {
  const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1000);
  const expiresAt = new Date((nowSeconds + options.ttlSeconds) * 1000);
  const token = await new SignJWT({
    sid: claims.sid,
    email: claims.email,
    role: claims.role,
    verified: claims.verified,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setJti(claims.jti)
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + options.ttlSeconds)
    .setIssuer(options.issuer)
    .setAudience(options.audience)
    .sign(new TextEncoder().encode(options.secret));
  return { token, expiresAt };
}

export async function verifyAccessToken(
  token: string,
  options: Pick<JwtOptions, "secret" | "issuer" | "audience"> & { now?: Date },
): Promise<AccessTokenClaims | null> {
  try {
    const { payload, protectedHeader } = await jwtVerify(
      token,
      new TextEncoder().encode(options.secret),
      {
        algorithms: ["HS256"],
        issuer: options.issuer,
        audience: options.audience,
        ...(options.now ? { currentDate: options.now } : {}),
      },
    );
    if (
      protectedHeader.typ !== "JWT" ||
      typeof payload.sub !== "string" ||
      typeof payload.sid !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "LEARNER" && payload.role !== "REVIEWER" && payload.role !== "ADMIN") ||
      typeof payload.verified !== "boolean" ||
      typeof payload.jti !== "string" ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number" ||
      payload.iss !== options.issuer
    ) {
      return null;
    }
    return payload as unknown as AccessTokenClaims;
  } catch {
    return null;
  }
}

export const createOpaqueToken = (): string => randomBytes(32).toString("base64url");

export function hashOpaqueToken(token: string, pepper: string): string {
  return createHmac("sha256", pepper).update(token).digest("hex");
}

export const createOtpCode = (): string => randomInt(0, 1_000_000).toString().padStart(6, "0");

export function hashOtpCode(email: string, purpose: string, code: string, pepper: string): string {
  return createHmac("sha256", pepper)
    .update(`${purpose}:${email.trim().toLowerCase()}:${code}`)
    .digest("hex");
}

export function safeEqual(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const values: Record<string, string> = {};
  for (const part of header?.split(";") ?? []) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    const name = part.slice(0, separator).trim();
    try {
      values[name] = decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      // Ignore malformed cookies instead of rejecting an otherwise valid request.
    }
  }
  return values;
}

interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Lax" | "Strict";
  path: string;
  maxAge?: number;
  expires?: Date;
}

export function serializeCookie(name: string, value: string, options: CookieOptions): string {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${options.path}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  parts.push(`SameSite=${options.sameSite ?? "Lax"}`);
  return parts.join("; ");
}
