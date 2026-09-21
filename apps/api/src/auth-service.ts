import { randomUUID } from "node:crypto";
import { hash as hashPassword, verify as verifyPassword } from "@node-rs/argon2";
import type {
  AuthResult,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  User,
  VerifyEmailInput,
} from "@quran-feham/contracts";
import {
  type OtpPurpose,
  type QuranFehamRepository,
  RepositoryConflictError,
  type UserRecord,
} from "@quran-feham/database";
import type { ApiConfig } from "./config.js";
import { ApiError } from "./errors.js";
import type { AuthMailer } from "./mailer.js";
import {
  type AccessTokenClaims,
  createOpaqueToken,
  createOtpCode,
  hashOpaqueToken,
  hashOtpCode,
  safeEqual,
  signAccessToken,
  verifyAccessToken,
} from "./security.js";

export interface AuthRequestContext {
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
}

export interface IssuedAuth {
  result: AuthResult;
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
}

export interface AuthenticatedUser {
  claims: AccessTokenClaims;
  user: UserRecord;
}

const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

function toPublicUser(user: UserRecord): User {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    locale: user.locale,
    emailVerified: Boolean(user.emailVerifiedAt),
    createdAt: user.createdAt.toISOString(),
  };
}

function isUniqueConflict(error: unknown): boolean {
  if (error instanceof RepositoryConflictError) return true;
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export class AuthService {
  constructor(
    private readonly repository: QuranFehamRepository,
    private readonly mailer: AuthMailer,
    private readonly config: ApiConfig,
  ) {}

  async register(input: RegisterInput, context: AuthRequestContext): Promise<IssuedAuth> {
    const passwordHash = await hashPassword(input.password, ARGON2_OPTIONS);
    let user: UserRecord;
    try {
      user = await this.repository.createUser({
        email: input.email,
        passwordHash,
        ...(input.displayName ? { displayName: input.displayName } : {}),
        locale: input.locale,
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        throw new ApiError(409, "EMAIL_IN_USE", "An account with this email already exists");
      }
      throw error;
    }

    await this.repository.createDefaultPreferences(user.id, user.locale);
    const verificationCode = await this.createAndSendOtp(user, "VERIFY_EMAIL");
    return this.issueSession(user, context, verificationCode);
  }

  async login(input: LoginInput, context: AuthRequestContext): Promise<IssuedAuth> {
    const user = await this.repository.findUserByEmail(input.email);
    let passwordMatches = false;
    if (user?.passwordHash) {
      try {
        passwordMatches = await verifyPassword(user.passwordHash, input.password);
      } catch {
        passwordMatches = false;
      }
    } else {
      // Keep the missing-account path expensive enough to reduce timing disclosure.
      await hashPassword(input.password, ARGON2_OPTIONS);
    }
    if (!user || !passwordMatches) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
    }
    if (!user.emailVerifiedAt) {
      await this.createAndSendOtp(user, "VERIFY_EMAIL");
      throw new ApiError(
        403,
        "EMAIL_VERIFICATION_REQUIRED",
        "Verify your email with the code we sent before signing in",
      );
    }
    return this.issueSession(user, {
      ...context,
      ...(input.deviceName ? { deviceName: input.deviceName } : {}),
    });
  }

  async refresh(refreshToken: string): Promise<IssuedAuth> {
    const currentHash = hashOpaqueToken(refreshToken, this.config.refreshTokenPepper);
    const record = await this.repository.findSessionByRefreshTokenHash(currentHash);
    const now = new Date();
    if (record?.matched === "rotated") {
      await this.repository.revokeSessionFamily(record.session.tokenFamilyId, now);
      throw new ApiError(
        401,
        "REFRESH_TOKEN_REUSE",
        "Your session has been revoked. Please sign in again",
      );
    }
    if (!record || record.session.revokedAt || record.session.expiresAt <= now) {
      throw new ApiError(401, "INVALID_SESSION", "Your session has expired. Please sign in again");
    }
    if (!record.user.emailVerifiedAt) {
      throw new ApiError(403, "EMAIL_VERIFICATION_REQUIRED", "Verify your email before continuing");
    }

    const nextRefreshToken = createOpaqueToken();
    const nextHash = hashOpaqueToken(nextRefreshToken, this.config.refreshTokenPepper);
    const refreshExpiresAt = new Date(now.getTime() + this.config.refreshTtlSeconds * 1000);
    const rotated = await this.repository.rotateSession(
      record.session.id,
      currentHash,
      nextHash,
      now,
      refreshExpiresAt,
    );
    if (!rotated) {
      // A successful lookup followed by a failed compare-and-swap means the
      // token changed while this request was in flight. Treat the loser as a
      // replay and revoke the whole family instead of leaving the winning
      // refresh token usable.
      await this.repository.revokeSessionFamily(record.session.tokenFamilyId, now);
      throw new ApiError(
        401,
        "REFRESH_TOKEN_REUSE",
        "Your session has been revoked. Please sign in again",
      );
    }

    const access = await this.createAccessToken(record.user, rotated.id);
    return {
      result: this.authResult(record.user, access, undefined),
      accessToken: access.token,
      refreshToken: nextRefreshToken,
      accessExpiresAt: access.expiresAt,
      refreshExpiresAt,
    };
  }

  async authenticate(accessToken: string): Promise<AuthenticatedUser> {
    const claims = await verifyAccessToken(accessToken, {
      secret: this.config.jwtSecret,
      issuer: this.config.jwtIssuer,
      audience: this.config.jwtAudience,
    });
    if (!claims) throw new ApiError(401, "UNAUTHENTICATED", "Please sign in to continue");

    const [user, session] = await Promise.all([
      this.repository.findUserById(claims.sub),
      this.repository.findSessionById(claims.sid),
    ]);
    if (
      !user ||
      !session ||
      session.userId !== user.id ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      throw new ApiError(401, "INVALID_SESSION", "Your session has expired. Please sign in again");
    }
    if (!user.emailVerifiedAt) {
      throw new ApiError(403, "EMAIL_VERIFICATION_REQUIRED", "Verify your email before continuing");
    }
    return { claims, user };
  }

  async verifyEmail(input: VerifyEmailInput): Promise<User> {
    const user = await this.repository.findUserByEmail(input.email);
    if (!user) throw this.invalidCodeError();
    const challenge = await this.verifyOtp(input.email, "VERIFY_EMAIL", input.code);
    if (challenge.userId && challenge.userId !== user.id) throw this.invalidCodeError();
    if (user.emailVerifiedAt) return toPublicUser(user);
    return toPublicUser(await this.repository.markEmailVerified(user.id, new Date()));
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    await this.handleGenericOtpRequest(input.email, "PASSWORD_RESET", () => true);
  }

  async resendVerification(input: ForgotPasswordInput): Promise<void> {
    await this.handleGenericOtpRequest(
      input.email,
      "VERIFY_EMAIL",
      (user) => !user.emailVerifiedAt,
    );
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const user = await this.repository.findUserByEmail(input.email);
    if (!user) throw this.invalidCodeError();
    const challenge = await this.verifyOtp(input.email, "PASSWORD_RESET", input.code);
    if (challenge.userId && challenge.userId !== user.id) throw this.invalidCodeError();
    const nextHash = await hashPassword(input.password, ARGON2_OPTIONS);
    await this.repository.updatePasswordHash(user.id, nextHash);
    await this.repository.revokeAllSessions(user.id, new Date());
  }

  async logout(accessToken?: string, refreshToken?: string): Promise<void> {
    const now = new Date();
    if (refreshToken) {
      const hash = hashOpaqueToken(refreshToken, this.config.refreshTokenPepper);
      const record = await this.repository.findSessionByRefreshTokenHash(hash);
      if (record) {
        await this.repository.revokeSession(record.session.id, record.user.id, now);
        return;
      }
    }
    if (accessToken) {
      const claims = await verifyAccessToken(accessToken, {
        secret: this.config.jwtSecret,
        issuer: this.config.jwtIssuer,
        audience: this.config.jwtAudience,
      });
      if (claims) await this.repository.revokeSession(claims.sid, claims.sub, now);
    }
  }

  userResponse(user: UserRecord): User {
    return toPublicUser(user);
  }

  async listSessions(userId: string, currentSessionId: string) {
    const now = new Date();
    const sessions = await this.repository.listSessions(userId);
    return sessions
      .filter((session) => session.expiresAt > now)
      .map((session) => ({
        id: session.id,
        deviceName: session.deviceName,
        createdAt: session.createdAt.toISOString(),
        lastUsedAt: session.lastUsedAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        current: session.id === currentSessionId,
      }));
  }

  revokeSession(sessionId: string, userId: string): Promise<boolean> {
    return this.repository.revokeSession(sessionId, userId, new Date());
  }

  private async issueSession(
    user: UserRecord,
    context: AuthRequestContext,
    developmentVerificationCode?: string,
  ): Promise<IssuedAuth> {
    const refreshToken = createOpaqueToken();
    const refreshTokenHash = hashOpaqueToken(refreshToken, this.config.refreshTokenPepper);
    const refreshExpiresAt = new Date(Date.now() + this.config.refreshTtlSeconds * 1000);
    const session = await this.repository.createSession({
      userId: user.id,
      tokenFamilyId: randomUUID(),
      refreshTokenHash,
      deviceName: context.deviceName ?? "This device",
      ...(context.userAgent ? { userAgent: context.userAgent.slice(0, 512) } : {}),
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      expiresAt: refreshExpiresAt,
    });
    const access = await this.createAccessToken(user, session.id);
    return {
      result: this.authResult(user, access, developmentVerificationCode),
      accessToken: access.token,
      refreshToken,
      accessExpiresAt: access.expiresAt,
      refreshExpiresAt,
    };
  }

  private createAccessToken(user: UserRecord, sessionId: string) {
    return signAccessToken(
      {
        sub: user.id,
        sid: sessionId,
        email: user.email,
        role: user.role,
        verified: Boolean(user.emailVerifiedAt),
        jti: randomUUID(),
      },
      {
        secret: this.config.jwtSecret,
        issuer: this.config.jwtIssuer,
        audience: this.config.jwtAudience,
        ttlSeconds: this.config.accessTtlSeconds,
      },
    );
  }

  private authResult(
    user: UserRecord,
    access: { token: string; expiresAt: Date },
    developmentVerificationCode?: string,
  ): AuthResult {
    return {
      user: toPublicUser(user),
      ...(this.config.exposeAccessToken ? { accessToken: access.token } : {}),
      accessExpiresAt: access.expiresAt.toISOString(),
      verificationRequired: !user.emailVerifiedAt,
      ...(this.config.exposeDevelopmentCodes && developmentVerificationCode
        ? { developmentVerificationCode }
        : {}),
    };
  }

  private async createAndSendOtp(user: UserRecord, purpose: OtpPurpose): Promise<string> {
    const code = createOtpCode();
    const expiresAt = new Date(Date.now() + this.config.otpTtlSeconds * 1000);
    await this.repository.createOtpChallenge({
      userId: user.id,
      email: user.email,
      purpose,
      codeHash: hashOtpCode(user.email, purpose, code, this.config.otpPepper),
      expiresAt,
    });
    await this.mailer.send({
      email: user.email,
      code,
      expiresAt,
      kind: purpose === "VERIFY_EMAIL" ? "verify-email" : "reset-password",
    });
    return code;
  }

  private async handleGenericOtpRequest(
    email: string,
    purpose: OtpPurpose,
    shouldSend: (user: UserRecord) => boolean,
  ): Promise<void> {
    const operation = async () => {
      const user = await this.repository.findUserByEmail(email);
      if (user && shouldSend(user)) await this.createAndSendOtp(user, purpose);
    };

    if (this.config.environment !== "production") {
      await operation();
      return;
    }

    // Generic recovery endpoints must not reveal account existence through
    // SMTP or database latency. Dispatch after the fixed response window;
    // startup SMTP verification and operational alerting cover delivery health.
    setTimeout(() => {
      void operation().catch(() => {
        console.error(`Background ${purpose} email dispatch failed`);
      });
    }, this.config.genericAuthResponseMs);
    await new Promise((resolve) => setTimeout(resolve, this.config.genericAuthResponseMs));
  }

  private async verifyOtp(email: string, purpose: OtpPurpose, code: string) {
    const challenge = await this.repository.findLatestOtpChallenge(email, purpose);
    const now = new Date();
    if (!challenge) throw this.invalidCodeError();

    const actualHash = hashOtpCode(email, purpose, code, this.config.otpPepper);
    const accepted = await this.repository.applyOtpAttempt(
      challenge.id,
      safeEqual(actualHash, challenge.codeHash),
      this.config.otpMaxAttempts,
      now,
    );
    if (!accepted) throw this.invalidCodeError();
    return challenge;
  }

  private invalidCodeError(): ApiError {
    return new ApiError(400, "INVALID_OR_EXPIRED_CODE", "The code is invalid or has expired");
  }
}
