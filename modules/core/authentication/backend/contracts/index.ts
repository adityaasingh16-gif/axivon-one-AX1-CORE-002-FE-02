/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Shared contracts: DTOs, error codes, route paths, configuration shape.
 *
 * Task: AX1-CORE-001-BE-02 — Implement core API operations for login,
 * registration, logout, verification, password recovery and session handling.
 *
 * Conventions honoured here:
 *  - `docs/07-API-SPECIFICATION.md` §9 (action-style auth endpoints), §13/§14
 *    (response + error envelope), §16 (auth flows), §35 (Core API catalog).
 *  - `docs/api/README.md` (success/error envelope actually shipped in-repo).
 *  - `packages/types/src/auth.types.ts` is reused (`AuthTokens`, `LoginCredentials`).
 *
 * NOTE: `AuthUserSummary` from `@axivon/types` is deliberately NOT returned yet —
 * it requires `roles`/`permissions`, which are CORE-003/CORE-004 deliverables.
 */

import type { AuthTokens, LoginCredentials } from '@axivon/types';

export type { AuthTokens, LoginCredentials };

/** ISO-8601 UTC string, per `07-API-SPECIFICATION.md` §23. */
export type ISODateString = string;

/** Opaque identifier. Concrete technology is TBD (`06-DATABASE-ARCHITECTURE.md` §12). */
export type UUID = string;

// ---------------------------------------------------------------------------
// User status
// ---------------------------------------------------------------------------

/** Mirrors `UserStatus` in `packages/types/src/user.types.ts`. */
export type AuthUserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

/**
 * Stable, machine-readable error codes (`07-API-SPECIFICATION.md` §14).
 * `UPPER_SNAKE_CASE`; Frontend branches on `code`, never on the HTTP status alone.
 */
export const AUTH_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  EMAIL_ALREADY_REGISTERED: 'EMAIL_ALREADY_REGISTERED',
  INVALID_OR_EXPIRED_TOKEN: 'INVALID_OR_EXPIRED_TOKEN',
  TOKEN_ALREADY_USED: 'TOKEN_ALREADY_USED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

/** Error code -> HTTP status mapping (`07-API-SPECIFICATION.md` §11, §14). */
export const AUTH_ERROR_STATUS: Readonly<Record<AuthErrorCode, number>> = {
  VALIDATION_ERROR: 422,
  INVALID_CREDENTIALS: 401,
  EMAIL_NOT_VERIFIED: 401,
  ACCOUNT_SUSPENDED: 401,
  ACCOUNT_LOCKED: 401,
  EMAIL_ALREADY_REGISTERED: 409,
  INVALID_OR_EXPIRED_TOKEN: 401,
  TOKEN_ALREADY_USED: 401,
  SESSION_EXPIRED: 401,
  SESSION_REVOKED: 401,
  RESOURCE_NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  RATE_LIMITED: 429,
  UNAUTHORIZED: 401,
  INTERNAL_ERROR: 500,
};

// ---------------------------------------------------------------------------
// Response envelopes
// ---------------------------------------------------------------------------

/**
 * Success envelope. Matches `docs/api/README.md` and `ApiResponse` from
 * `@axivon/types`, extended with the optional `meta` object required by
 * `07-API-SPECIFICATION.md` §13. See `docs/OPEN-QUESTIONS.md` (Q1).
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: ISODateString;
  meta?: Record<string, unknown>;
}

/** Field-level detail for `VALIDATION_ERROR` (`07-API-SPECIFICATION.md` §14). */
export interface ValidationIssue {
  field: string;
  issue: string;
}

export interface ApiFailureResponse {
  success: false;
  error: {
    code: AuthErrorCode;
    message: string;
    details: ValidationIssue[];
    requestId: string;
  };
  timestamp: ISODateString;
}

export type ApiEnvelope<T> = ApiSuccessResponse<T> | ApiFailureResponse;

// ---------------------------------------------------------------------------
// Domain records (what the repositories persist)
// ---------------------------------------------------------------------------

export interface AuthUserRecord {
  id: UUID;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  status: AuthUserStatus;
  emailVerified: boolean;
  failedLoginAttempts: number;
  lockedUntil: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type SessionDeviceType = 'web' | 'mobile' | 'api' | 'unknown';

export interface SessionRecord {
  id: UUID;
  userId: UUID;
  /** SHA-256 of the refresh token — the raw token is never stored (§29). */
  refreshTokenHash: string;
  expiresAt: ISODateString;
  revokedAt: ISODateString | null;
  ipAddress?: string;
  userAgent?: string;
  deviceType: SessionDeviceType;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type AuthTokenPurpose = 'email_verification' | 'password_reset';

export interface AuthTokenRecord {
  id: UUID;
  userId: UUID;
  /** SHA-256 of the raw token — the raw token is never stored (§29). */
  tokenHash: string;
  purpose: AuthTokenPurpose;
  expiresAt: ISODateString;
  consumedAt: ISODateString | null;
  /** Set when superseded/revoked without being redeemed; distinct from use. */
  invalidatedAt: ISODateString | null;
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Client-facing shapes
// ---------------------------------------------------------------------------

/**
 * The authenticated principal returned by auth endpoints.
 * Intentionally narrower than `AuthUserSummary` (`@axivon/types`): roles and
 * permissions arrive with CORE-003/CORE-004.
 */
export interface AuthUser {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  status: AuthUserStatus;
  emailVerified: boolean;
}

export interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
  session: SessionInfo;
}

export interface SessionInfo {
  id: UUID;
  expiresAt: ISODateString;
  deviceType: SessionDeviceType;
  ipAddress?: string;
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LogoutInput {
  /** Raw `Authorization` header value, e.g. `Bearer <access token>`. */
  authorization?: string;
}

export interface RefreshInput {
  refreshToken: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface VerifyEmailInput {
  token: string;
}

export interface RevokeSessionInput {
  sessionId: UUID;
}

/** Context the HTTP layer derives — never taken from client-supplied bodies. */
export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
  deviceType?: SessionDeviceType;
  requestId: string;
}

export interface AuthenticatedRequestContext extends RequestContext {
  /** Populated by `requireAuth` after the access token is verified. */
  userId: UUID;
  sessionId: UUID;
}

// ---------------------------------------------------------------------------
// Route paths
// ---------------------------------------------------------------------------

/**
 * Canonical auth routes.
 * Source of truth: `07-API-SPECIFICATION.md` §16 + §35 (Core API catalog),
 * served under the `/api/v1` prefix (`.env.example` `API_PREFIX`).
 *
 * `/auth/verify-email` is registered as a documented alias of `/auth/verify`
 * because `03-BACKEND-TEAM.md` §7 lists `POST /auth/verify-email`.
 * See `docs/OPEN-QUESTIONS.md` (Q2).
 */
export const AUTH_ROUTES = {
  REGISTER: '/api/v1/auth/register',
  LOGIN: '/api/v1/auth/login',
  LOGOUT: '/api/v1/auth/logout',
  REFRESH: '/api/v1/auth/refresh',
  FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
  RESET_PASSWORD: '/api/v1/auth/reset-password',
  VERIFY: '/api/v1/auth/verify',
  VERIFY_EMAIL_ALIAS: '/api/v1/auth/verify-email',
  SESSIONS: '/api/v1/auth/sessions',
  REVOKE_SESSION: '/api/v1/auth/sessions/revoke',
  REVOKE_ALL_SESSIONS: '/api/v1/auth/sessions/revoke-all',
} as const;

export type AuthRoute = (typeof AUTH_ROUTES)[keyof typeof AUTH_ROUTES];

// ---------------------------------------------------------------------------
// Module configuration
// ---------------------------------------------------------------------------

/**
 * Everything tunable lives here so the module stays free of client-specific
 * constants (`03-BACKEND-TEAM.md` §12 Reusability Rules) and so values can be
 * driven by environment (`07-API-SPECIFICATION.md` §27: limits configurable,
 * never hardcoded).
 */
export interface AuthModuleConfig {
  /** Token issuer (`iss` claim). */
  issuer: string;
  /** Access-token signing secret — minimum 32 characters. */
  jwtSecret: string;
  /** Refresh-token signing secret — must differ from `jwtSecret`. */
  jwtRefreshSecret: string;
  /** Access token lifetime, seconds. */
  accessTokenTtlSeconds: number;
  /** Refresh token lifetime, seconds. */
  refreshTokenTtlSeconds: number;
  /** Email verification token lifetime, seconds. */
  emailVerificationTtlSeconds: number;
  /** Password reset token lifetime, seconds. */
  passwordResetTtlSeconds: number;
  /** Failed logins before the account is temporarily locked. */
  maxFailedLoginAttempts: number;
  /** Lockout duration, seconds. */
  lockoutDurationSeconds: number;
  /** Rotate refresh tokens on every `/auth/refresh` call. */
  rotateRefreshTokens: boolean;
  /** Minimum accepted password length. */
  minPasswordLength: number;
  /** Maximum accepted password length (bounds hashing cost). */
  maxPasswordLength: number;
  /** Fixed-window rate limits, per identifier. 0 disables a given bucket. */
  rateLimits: {
    windowSeconds: number;
    loginPerIp: number;
    loginPerEmail: number;
    registerPerIp: number;
    forgotPasswordPerIp: number;
    forgotPasswordPerEmail: number;
    resetPasswordPerIp: number;
    verifyEmailPerIp: number;
  };
}
