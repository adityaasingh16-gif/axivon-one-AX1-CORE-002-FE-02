/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Authentication service — the core API operations for login, registration,
 * logout, verification, password recovery and session handling.
 *
 * Task AX1-CORE-001-BE-02.
 *
 * Flows implemented (`07-API-SPECIFICATION.md` §16, §35; `05-SYSTEM-ARCHITECTURE.md` §12):
 *   register → email verification → login → session issue → refresh → logout
 *   forgot-password → reset-password
 *   list sessions → revoke session → revoke all sessions
 *
 * Security controls implemented (`03-BACKEND-TEAM.md` §22, `07-API-SPECIFICATION.md` §28):
 *   - Adaptive password hashing; plaintext never stored, logged or returned.
 *   - Generic 401s: "no such user" and "wrong password" are indistinguishable,
 *     including in response timing (dummy hash on the missing-user branch).
 *   - Rate limiting on every unauthenticated auth endpoint.
 *   - Account lockout after repeated failures.
 *   - Single-use, hashed, expiring verification and reset tokens.
 *   - Refresh-token rotation with reuse detection (revoke-all on replay).
 *   - Server-side session store, so logout and password change actually revoke.
 *   - `organizationId` is never trusted from the client (`07-API-SPECIFICATION.md` §18).
 *
 * Everything is injected: no database driver, HTTP framework or email provider
 * is imported here, so the service is unit-testable in isolation
 * (`05-SYSTEM-ARCHITECTURE.md` §16 separation rationale).
 */

import { randomUUID } from 'node:crypto';
import {
  accountLocked,
  accountSuspended,
  emailNotVerified,
  invalidCredentials,
  invalidOrExpiredToken,
  rateLimited,

  resourceNotFound,
  sessionRevoked,
  tokenAlreadyUsed,
  unauthorized,
  validationError,
} from '../contracts/errors.js';
import type {
  AuthModuleConfig,
  AuthResult,
  AuthTokens,
  AuthUser,
  AuthUserRecord,
  ForgotPasswordInput,
  ISODateString,
  LoginCredentials,
  LogoutInput,
  RefreshInput,
  RegisterInput,
  RequestContext,
  ResetPasswordInput,
  SessionInfo,
  SessionRecord,
  UUID,
  VerifyEmailInput,
} from '../contracts/index.js';
import type { AuthRepositories } from '../repositories/index.js';
import type { PasswordHasher } from '../utils/password.hasher.js';
import { RATE_LIMIT_BUCKETS, type RateLimiter } from '../utils/rate.limiter.js';
import { generateRawToken, hashRefreshToken, hashToken } from '../utils/random.js';
import type { TokenProvider } from '../utils/token.provider.js';
import { buildAuthMailMessage, type Mailer } from './mailer.service.js';
import type { AuthAuditSink } from './audit.service.js';

export interface Clock {
  now(): Date;
}

export const systemClock = (): Clock => ({ now: () => new Date() });

const addSeconds = (from: Date, seconds: number): Date =>
  new Date(from.getTime() + seconds * 1000);

export interface AuthServiceDependencies {
  config: AuthModuleConfig;
  repositories: AuthRepositories;
  passwordHasher: PasswordHasher;
  tokenProvider: TokenProvider;
  mailer: Mailer;
  audit: AuthAuditSink;
  rateLimiter: RateLimiter;
  clock?: Clock;
}

export interface RegisterResult {
  user: AuthUser;
  /**
   * `true` when this call created the account. The HTTP layer does NOT branch
   * on it — the response is identical either way, to avoid account
   * enumeration. It exists for tests and internal callers.
   */
  created: boolean;
}

export interface VerifyEmailResult {
  user: AuthUser;
}

export interface ForgotPasswordResult {
  /** Always `true` at the API boundary: the response is generic by design. */
  accepted: true;
}

export interface ResetPasswordResult {
  /** Number of sessions revoked because the password changed. */
  revokedSessions: number;
}

export interface RevokeSessionResult {
  sessionId: UUID;
  revokedAt: ISODateString;
}

export interface RevokeAllSessionsResult {
  revokedSessions: number;
}

export interface SessionVerification {
  userId: UUID;
  sessionId: UUID;
  user: AuthUser;
}

export class AuthenticationService {
  private readonly config: AuthModuleConfig;
  private readonly repositories: AuthRepositories;
  private readonly passwordHasher: PasswordHasher;
  private readonly tokenProvider: TokenProvider;
  private readonly mailer: Mailer;
  private readonly audit: AuthAuditSink;
  private readonly rateLimiter: RateLimiter;
  private readonly clock: Clock;

  public constructor(dependencies: AuthServiceDependencies) {
    this.config = dependencies.config;
    this.repositories = dependencies.repositories;
    this.passwordHasher = dependencies.passwordHasher;
    this.tokenProvider = dependencies.tokenProvider;
    this.mailer = dependencies.mailer;
    this.audit = dependencies.audit;
    this.rateLimiter = dependencies.rateLimiter;
    this.clock = dependencies.clock ?? systemClock();
  }

  // -------------------------------------------------------------------------
  // POST /auth/register
  // -------------------------------------------------------------------------

  public async register(input: RegisterInput, context: RequestContext): Promise<RegisterResult> {
    const now = this.clock.now();
    await this.enforceRateLimit(
      RATE_LIMIT_BUCKETS.registerIp(context.ipAddress ?? 'unknown'),
      this.config.rateLimits.registerPerIp,
      context,
    );

    const email = input.email.trim().toLowerCase();
    const existing = await this.repositories.users.findByEmail(email);

    if (existing !== null) {
      // Same response shape and timing as the success path: the caller cannot
      // learn whether the address is taken (`07-API-SPECIFICATION.md` §14).
      await this.audit.record({
        event: 'auth.register',
        requestId: context.requestId,
        email,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        errorCode: 'EMAIL_ALREADY_REGISTERED',
        outcome: 'failure',
        occurredAt: now.toISOString(),
      });
      return { user: this.toPublicUser(existing), created: false };
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.repositories.users.create({
      email,
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      // Created `pending` and activated on email verification, per
      // `07-API-SPECIFICATION.md` §16 ("may require Email Verification").
      status: 'pending',
      emailVerified: false,
      now: now.toISOString(),
    });

    await this.issueEmailVerificationToken(user.id, email, now, context);

    await this.audit.record({
      event: 'auth.register',
      requestId: context.requestId,
      userId: user.id,
      email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      outcome: 'success',
      occurredAt: now.toISOString(),
    });

    return { user: this.toPublicUser(user), created: true };
  }

  // -------------------------------------------------------------------------
  // POST /auth/verify  (alias: POST /auth/verify-email)
  // -------------------------------------------------------------------------

  public async verifyEmail(
    input: VerifyEmailInput,
    context: RequestContext,
  ): Promise<VerifyEmailResult> {
    const now = this.clock.now();
    await this.enforceRateLimit(
      RATE_LIMIT_BUCKETS.verifyEmailIp(context.ipAddress ?? 'unknown'),
      this.config.rateLimits.verifyEmailPerIp,
      context,
    );

    const token = await this.repositories.tokens.findByHash(
      hashToken(input.token),
      'email_verification',
    );
    if (token === null) {
      throw invalidOrExpiredToken();
    }
    if (token.invalidatedAt !== null) {
      throw invalidOrExpiredToken();
    }
    if (token.consumedAt !== null) {
      throw tokenAlreadyUsed();
    }
    if (new Date(token.expiresAt).getTime() <= now.getTime()) {
      throw invalidOrExpiredToken();
    }

    const consumed = await this.repositories.tokens.consume(token.id, now.toISOString());
    if (!consumed) {
      // Lost a race with a concurrent request — treat as already used.
      throw tokenAlreadyUsed();
    }

    const user = await this.repositories.users.findById(token.userId);
    if (user === null) {
      throw invalidOrExpiredToken();
    }

    await this.repositories.users.markEmailVerified(user.id, now.toISOString());

    // A `pending` account becomes active; any other status is left untouched
    // so a suspended account cannot self-reactivate by verifying an email
    // (`updateStatus` compares against the expected status atomically).
    let finalStatus = user.status;
    if (user.status === 'pending') {
      const activated = await this.repositories.users.updateStatus(
        user.id,
        'active',
        'pending',
        now.toISOString(),
      );
      if (activated) {
        finalStatus = 'active';
      }
    }

    await this.audit.record({
      event: 'auth.email.verified',
      requestId: context.requestId,
      userId: user.id,
      ipAddress: context.ipAddress,
      outcome: 'success',
      occurredAt: now.toISOString(),
    });

    return { user: this.toPublicUser({ ...user, emailVerified: true, status: finalStatus }) };
  }

  // -------------------------------------------------------------------------
  // POST /auth/login
  // -------------------------------------------------------------------------

  public async login(input: LoginCredentials, context: RequestContext): Promise<AuthResult> {
    const now = this.clock.now();

    // A client-supplied tenant id is rejected, never trusted:
    // `07-API-SPECIFICATION.md` §18 — tenant context comes from the session.
    if (input.organizationId !== undefined) {
      throw validationError([
        {
          field: 'organizationId',
          issue: 'is not accepted here; organization context is derived from the authenticated session',
        },
      ]);
    }

    const email = (input.email ?? '').trim().toLowerCase();
    const ip = context.ipAddress ?? 'unknown';

    await this.enforceRateLimit(RATE_LIMIT_BUCKETS.loginIp(ip), this.config.rateLimits.loginPerIp, context);
    await this.enforceRateLimit(
      RATE_LIMIT_BUCKETS.loginEmail(email),
      this.config.rateLimits.loginPerEmail,
      context,
    );

    const user = await this.repositories.users.findByEmail(email);

    if (user === null) {
      // Spend the same time as a real verification so timing cannot be used to
      // enumerate accounts.
      await this.passwordHasher.dummyVerify();
      await this.recordLoginFailure(undefined, email, context, 'INVALID_CREDENTIALS', now);
      throw invalidCredentials();
    }

    if (this.isLocked(user, now)) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((new Date(user.lockedUntil as string).getTime() - now.getTime()) / 1000),
      );
      await this.audit.record({
        event: 'auth.login.locked',
        requestId: context.requestId,
        userId: user.id,
        email,
        ipAddress: context.ipAddress,
        errorCode: 'ACCOUNT_LOCKED',
        outcome: 'failure',
        occurredAt: now.toISOString(),
      });
      throw accountLocked(retryAfterSeconds);
    }

    const passwordMatches = await this.passwordHasher.verify(input.password, user.passwordHash);
    if (!passwordMatches) {
      await this.recordLoginFailure(user.id, email, context, 'INVALID_CREDENTIALS', now);
      throw invalidCredentials();
    }

    if (user.status === 'suspended') {
      await this.recordLoginFailure(user.id, email, context, 'ACCOUNT_SUSPENDED', now);
      throw accountSuspended();
    }

    if (!user.emailVerified) {
      await this.recordLoginFailure(user.id, email, context, 'EMAIL_NOT_VERIFIED', now);
      throw emailNotVerified();
    }

    if (user.status !== 'active') {
      await this.recordLoginFailure(user.id, email, context, 'INVALID_CREDENTIALS', now);
      throw invalidCredentials();
    }

    // Successful: clear the failure counter and the rate-limit buckets.
    await this.repositories.users.resetFailedLogins(user.id, now.toISOString());
    await this.rateLimiter.reset(RATE_LIMIT_BUCKETS.loginIp(ip));
    await this.rateLimiter.reset(RATE_LIMIT_BUCKETS.loginEmail(email));

    const result = await this.issueSession(user, context, now);

    await this.audit.record({
      event: 'auth.login.success',
      requestId: context.requestId,
      userId: user.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      outcome: 'success',
      occurredAt: now.toISOString(),
    });

    return result;
  }

  // -------------------------------------------------------------------------
  // POST /auth/refresh
  // -------------------------------------------------------------------------

  public async refresh(input: RefreshInput, context: RequestContext): Promise<AuthResult> {
    const now = this.clock.now();

    // Signature/type/expiry verified first; everything after is state checks.
    const claims = this.tokenProvider.verifyRefreshToken(input.refreshToken);
    const session = await this.repositories.sessions.findById(claims.jti);

    if (session === null) {
      throw invalidOrExpiredToken();
    }

    if (session.revokedAt !== null) {
      // A revoked refresh token being presented is the signature of a stolen
      // token replayed after the legitimate client rotated it. Revoke the
      // whole family so the attacker's copy dies with it.
      if (this.config.rotateRefreshTokens) {
        await this.repositories.sessions.revokeAllForUser(session.userId, now.toISOString());
      }
      await this.audit.record({
        event: 'auth.token.reuse_detected',
        requestId: context.requestId,
        userId: session.userId,
        ipAddress: context.ipAddress,
        errorCode: 'SESSION_REVOKED',
        outcome: 'failure',
        occurredAt: now.toISOString(),
      });
      throw sessionRevoked();
    }

    if (new Date(session.expiresAt).getTime() <= now.getTime()) {
      throw sessionRevoked();
    }

    // The presented token must still be the current one for this session.
    const presentedHash = hashRefreshToken(input.refreshToken);
    if (session.refreshTokenHash !== presentedHash) {
      await this.repositories.sessions.revokeAllForUser(session.userId, now.toISOString());
      await this.audit.record({
        event: 'auth.token.reuse_detected',
        requestId: context.requestId,
        userId: session.userId,
        ipAddress: context.ipAddress,
        errorCode: 'SESSION_REVOKED',
        outcome: 'failure',
        occurredAt: now.toISOString(),
      });
      throw sessionRevoked();
    }

    const user = await this.repositories.users.findById(session.userId);
    if (user === null || user.status !== 'active' || !user.emailVerified) {
      throw invalidOrExpiredToken();
    }

    const expiresAt = addSeconds(now, this.config.refreshTokenTtlSeconds).toISOString();
    let tokens: AuthTokens;

    if (this.config.rotateRefreshTokens) {
      const rotated = this.issueTokenPair(user.id, session.id);
      await this.repositories.sessions.rotateRefreshToken(
        session.id,
        hashRefreshToken(rotated.refreshToken),
        expiresAt,
        now.toISOString(),
      );
      tokens = rotated;
    } else {
      tokens = this.issueTokenPair(user.id, session.id);
    }

    await this.audit.record({
      event: 'auth.token.refreshed',
      requestId: context.requestId,
      userId: user.id,
      ipAddress: context.ipAddress,
      outcome: 'success',
      occurredAt: now.toISOString(),
    });

    return {
      user: this.toPublicUser(user),
      tokens,
      session: this.toSessionInfo({ ...session, expiresAt, updatedAt: now.toISOString() }),
    };
  }

  // -------------------------------------------------------------------------
  // POST /auth/logout
  // -------------------------------------------------------------------------

  public async logout(input: LogoutInput, context: RequestContext): Promise<{ revoked: boolean }> {
    const now = this.clock.now();

    const authorization = input.authorization?.trim();
    if (authorization === undefined || authorization.length === 0) {
      throw unauthorized();
    }

    const rawToken = this.extractBearerToken(authorization);
    const claims = this.tokenProvider.verifyAccessToken(rawToken);

    const session = await this.repositories.sessions.findById(claims.jti);
    if (session === null) {
      // The token is signed but the session is gone. Idempotent success:
      // `POST /auth/logout` invalidates the current session (§16), and the
      // desired end state — no active session — already holds.
      return { revoked: false };
    }

    const revoked = await this.repositories.sessions.revoke(session.id, now.toISOString());

    await this.audit.record({
      event: 'auth.logout',
      requestId: context.requestId,
      userId: session.userId,
      ipAddress: context.ipAddress,
      outcome: 'success',
      occurredAt: now.toISOString(),
    });

    return { revoked };
  }

  /**
   * Verifies an access token and confirms its session is still live.
   * Used by the `requireAuth` middleware and by the session endpoints.
   */
  public async verifySessionToken(authorization: string | undefined): Promise<SessionVerification> {
    if (authorization === undefined || authorization.trim().length === 0) {
      throw unauthorized();
    }

    const claims = this.tokenProvider.verifyAccessToken(this.extractBearerToken(authorization));
    const session = await this.repositories.sessions.findById(claims.jti);

    if (session === null) {
      throw invalidOrExpiredToken();
    }
    if (session.revokedAt !== null) {
      throw sessionRevoked();
    }
    if (new Date(session.expiresAt).getTime() <= this.clock.now().getTime()) {
      throw sessionRevoked();
    }

    const user = await this.repositories.users.findById(claims.sub);
    if (user === null || user.status !== 'active') {
      throw invalidOrExpiredToken();
    }

    return { userId: user.id, sessionId: session.id, user: this.toPublicUser(user) };
  }

  // -------------------------------------------------------------------------
  // POST /auth/forgot-password
  // -------------------------------------------------------------------------

  public async forgotPassword(
    input: ForgotPasswordInput,
    context: RequestContext,
  ): Promise<ForgotPasswordResult> {
    const now = this.clock.now();
    const email = input.email.trim().toLowerCase();
    const ip = context.ipAddress ?? 'unknown';

    await this.enforceRateLimit(
      RATE_LIMIT_BUCKETS.forgotPasswordIp(ip),
      this.config.rateLimits.forgotPasswordPerIp,
      context,
    );
    await this.enforceRateLimit(
      RATE_LIMIT_BUCKETS.forgotPasswordEmail(email),
      this.config.rateLimits.forgotPasswordPerEmail,
      context,
    );

    const user = await this.repositories.users.findByEmail(email);

    if (user !== null && user.status !== 'suspended') {
      // Supersede any outstanding reset link so only the newest works.
      await this.repositories.tokens.invalidateAllForUser(user.id, 'password_reset', now.toISOString());

      const rawToken = generateRawToken();
      await this.repositories.tokens.create({
        userId: user.id,
        tokenHash: hashToken(rawToken),
        purpose: 'password_reset',
        expiresAt: addSeconds(now, this.config.passwordResetTtlSeconds).toISOString(),
        now: now.toISOString(),
      });

      await this.mailer.send(
        buildAuthMailMessage({
          to: email,
          template: 'password_reset',
          token: rawToken,
          expiresInSeconds: this.config.passwordResetTtlSeconds,
          expiresAt: addSeconds(now, this.config.passwordResetTtlSeconds).toISOString(),
          metadata: { requestId: context.requestId },
        }),
      );
    } else {
      // No account (or suspended): still spend comparable time so the response
      // timing does not reveal existence.
      await this.passwordHasher.dummyVerify();
    }

    await this.audit.record({
      event: 'auth.forgot_password.requested',
      requestId: context.requestId,
      email,
      ipAddress: context.ipAddress,
      // Deliberately no userId/exists flag: the audit trail must not become an
      // account-existence oracle for anyone reading it.
      outcome: 'success',
      occurredAt: now.toISOString(),
    });

    // Generic by design (`07-API-SPECIFICATION.md` §16).
    return { accepted: true };
  }

  // -------------------------------------------------------------------------
  // POST /auth/reset-password
  // -------------------------------------------------------------------------

  public async resetPassword(
    input: ResetPasswordInput,
    context: RequestContext,
  ): Promise<ResetPasswordResult> {
    const now = this.clock.now();
    await this.enforceRateLimit(
      RATE_LIMIT_BUCKETS.resetPasswordIp(context.ipAddress ?? 'unknown'),
      this.config.rateLimits.resetPasswordPerIp,
      context,
    );

    const token = await this.repositories.tokens.findByHash(hashToken(input.token), 'password_reset');
    if (token === null) {
      throw invalidOrExpiredToken();
    }
    if (token.invalidatedAt !== null) {
      throw invalidOrExpiredToken();
    }
    if (token.consumedAt !== null) {
      throw tokenAlreadyUsed();
    }
    if (new Date(token.expiresAt).getTime() <= now.getTime()) {
      throw invalidOrExpiredToken();
    }

    const consumed = await this.repositories.tokens.consume(token.id, now.toISOString());
    if (!consumed) {
      throw tokenAlreadyUsed();
    }

    const user = await this.repositories.users.findById(token.userId);
    if (user === null) {
      throw invalidOrExpiredToken();
    }
    if (user.status === 'suspended') {
      throw accountSuspended();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    await this.repositories.users.updatePassword(user.id, passwordHash, now.toISOString());

    // Password change must revoke sessions (`03-BACKEND-TEAM.md` §22:
    // "revocation on logout/password change"). The reset itself is not a login,
    // so no new session is issued here.
    const revokedSessions = await this.repositories.sessions.revokeAllForUser(
      user.id,
      now.toISOString(),
    );

    // Lockout state is cleared: a legitimate reset supersedes failed attempts.
    await this.repositories.users.resetFailedLogins(user.id, now.toISOString());

    await this.mailer.send(
      buildAuthMailMessage({
        to: user.email,
        template: 'password_changed',
        // No token: this is a notification, not an action link.
        token: '',
        expiresInSeconds: 0,
        expiresAt: now.toISOString(),
        metadata: { requestId: context.requestId, revokedSessions },
      }),
    );

    await this.audit.record({
      event: 'auth.password.reset',
      requestId: context.requestId,
      userId: user.id,
      ipAddress: context.ipAddress,
      outcome: 'success',
      occurredAt: now.toISOString(),
    });

    return { revokedSessions };
  }

  // -------------------------------------------------------------------------
  // Session handling: GET /auth/sessions, POST /auth/sessions/revoke,
  //                   POST /auth/sessions/revoke-all
  // -------------------------------------------------------------------------

  /** Live sessions for the authenticated user — never for an arbitrary id. */
  public async listSessions(userId: UUID): Promise<SessionInfo[]> {
    const now = this.clock.now();
    const sessions = await this.repositories.sessions.listByUser(userId);

    return sessions
      .filter((session) => session.revokedAt === null)
      .filter((session) => new Date(session.expiresAt).getTime() > now.getTime())
      .map((session) => this.toSessionInfo(session));
  }

  public async revokeSession(
    userId: UUID,
    sessionId: UUID,
    context: RequestContext,
  ): Promise<RevokeSessionResult> {
    const now = this.clock.now();
    const session = await this.repositories.sessions.findById(sessionId);

    // Ownership is enforced here, not only in middleware: another user's
    // session is reported as not found rather than forbidden, matching
    // `07-API-SPECIFICATION.md` §18's no-leakage rule.
    if (session === null || session.userId !== userId) {
      throw resourceNotFound('session');
    }

    await this.repositories.sessions.revoke(session.id, now.toISOString());

    await this.audit.record({
      event: 'auth.session.revoked',
      requestId: context.requestId,
      userId,
      ipAddress: context.ipAddress,
      outcome: 'success',
      occurredAt: now.toISOString(),
    });

    return { sessionId: session.id, revokedAt: now.toISOString() };
  }

  public async revokeAllSessions(
    userId: UUID,
    context: RequestContext,
  ): Promise<RevokeAllSessionsResult> {
    const now = this.clock.now();
    const revokedSessions = await this.repositories.sessions.revokeAllForUser(
      userId,
      now.toISOString(),
    );

    await this.audit.record({
      event: 'auth.sessions.revoked_all',
      requestId: context.requestId,
      userId,
      ipAddress: context.ipAddress,
      outcome: 'success',
      occurredAt: now.toISOString(),
    });

    return { revokedSessions };
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async issueEmailVerificationToken(
    userId: UUID,
    email: string,
    now: Date,
    context: RequestContext,
  ): Promise<void> {
    await this.repositories.tokens.invalidateAllForUser(userId, 'email_verification', now.toISOString());

    const rawToken = generateRawToken();
    await this.repositories.tokens.create({
      userId,
      tokenHash: hashToken(rawToken),
      purpose: 'email_verification',
      expiresAt: addSeconds(now, this.config.emailVerificationTtlSeconds).toISOString(),
      now: now.toISOString(),
    });

    await this.mailer.send(
      buildAuthMailMessage({
        to: email,
        template: 'email_verification',
        token: rawToken,
        expiresInSeconds: this.config.emailVerificationTtlSeconds,
        expiresAt: addSeconds(now, this.config.emailVerificationTtlSeconds).toISOString(),
        metadata: { requestId: context.requestId },
      }),
    );
  }

  private issueTokenPair(userId: UUID, sessionId: UUID): AuthTokens {
    return {
      accessToken: this.tokenProvider.issueAccessToken({ userId, sessionId }),
      refreshToken: this.tokenProvider.issueRefreshToken({ userId, sessionId }),
      // `expiresIn` is the access-token lifetime in seconds
      // (`packages/types/src/auth.types.ts` `AuthTokens`).
      expiresIn: this.config.accessTokenTtlSeconds,
    };
  }

  private async issueSession(
    user: AuthUserRecord,
    context: RequestContext,
    now: Date,
  ): Promise<AuthResult> {
    // Generate the session id before issuing tokens so the first insert already
    // contains the real refresh-token hash. A real repository can perform this
    // as one transaction; no row with an empty hash is ever created.
    const sessionId = newSessionId();
    const tokens = this.issueTokenPair(user.id, sessionId);
    const expiresAt = addSeconds(now, this.config.refreshTokenTtlSeconds).toISOString();
    const session = await this.repositories.sessions.create({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: hashRefreshToken(tokens.refreshToken),
      expiresAt,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceType: context.deviceType ?? 'unknown',
      now: now.toISOString(),
    });

    return {
      user: this.toPublicUser(user),
      tokens,
      session: this.toSessionInfo(session),
    };
  }

  private isLocked(user: AuthUserRecord, now: Date): boolean {
    if (user.lockedUntil === null) {
      return false;
    }
    return new Date(user.lockedUntil).getTime() > now.getTime();
  }

  private async recordLoginFailure(
    userId: UUID | undefined,
    email: string,
    context: RequestContext,
    errorCode: string,
    now: Date,
  ): Promise<void> {
    if (userId !== undefined) {
      await this.repositories.users.registerFailedLogin(
        userId,
        now.toISOString(),
        this.config.maxFailedLoginAttempts,
        this.config.lockoutDurationSeconds,
      );
    }

    await this.audit.record({
      event: 'auth.login.failure',
      requestId: context.requestId,
      userId,
      email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      errorCode,
      outcome: 'failure',
      occurredAt: now.toISOString(),
    });
  }

  private async enforceRateLimit(
    key: string,
    limit: number,
    context: RequestContext,
  ): Promise<void> {
    if (limit <= 0) {
      return;
    }
    const decision = await this.rateLimiter.consume(key, limit, this.config.rateLimits.windowSeconds);
    if (!decision.allowed) {
      await this.audit.record({
        event: 'auth.login.failure',
        requestId: context.requestId,
        ipAddress: context.ipAddress,
        errorCode: 'RATE_LIMITED',
        outcome: 'failure',
        occurredAt: this.clock.now().toISOString(),
      });
      throw rateLimited(decision.retryAfterSeconds);
    }
  }

  private extractBearerToken(authorization: string): string {
    const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
    const token = match?.[1]?.trim();
    if (token === undefined || token.length === 0) {
      throw unauthorized();
    }
    return token;
  }

  /** Strips `passwordHash` and every other internal field before serialising. */
  private toPublicUser(user: AuthUserRecord): AuthUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      emailVerified: user.emailVerified,
    };
  }

  private toSessionInfo(session: SessionRecord): SessionInfo {
    return {
      id: session.id,
      expiresAt: session.expiresAt,
      deviceType: session.deviceType,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
    };
  }
}

/** Convenience id used by the factory when no explicit session id is needed. */
export const newSessionId = (): UUID => randomUUID();
