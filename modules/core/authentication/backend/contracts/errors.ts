/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Typed error surface for the auth service.
 *
 * Rules honoured:
 *  - `07-API-SPECIFICATION.md` §14: errors never expose stack traces, SQL or
 *    internal paths; `401` messages stay generic to prevent account enumeration.
 *  - `05-SYSTEM-ARCHITECTURE.md` §21: one consistent error shape per category.
 */

import { AUTH_ERROR_CODES, type AuthErrorCode, type ValidationIssue } from './index.js';

/**
 * Every failure the auth service can raise. The HTTP layer maps `code` to a
 * status via `AUTH_ERROR_STATUS` and never leaks `cause` to the client.
 */
export class AuthError extends Error {
  public readonly code: AuthErrorCode;
  public readonly httpStatus: number;
  public readonly details: ValidationIssue[];
  /** Server-side only. Must never be serialised into a response body. */
  public readonly cause?: unknown;

  public constructor(
    code: AuthErrorCode,
    message: string,
    httpStatus: number,
    options?: { details?: ValidationIssue[]; cause?: unknown },
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = options?.details ?? [];
    this.cause = options?.cause;
    // Keeps `instanceof` working when the module is transpiled to ES5 targets.
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export const isAuthError = (value: unknown): value is AuthError => value instanceof AuthError;

// ---------------------------------------------------------------------------
// Constructors — one per documented failure mode, so error text stays
// consistent across endpoints instead of being re-worded per call site.
// ---------------------------------------------------------------------------

/** Generic 401 — deliberately identical for "no such user" and "wrong password". */
export const invalidCredentials = (): AuthError =>
  new AuthError(
    AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    'The email or password is incorrect.',
    401,
  );

export const emailNotVerified = (): AuthError =>
  new AuthError(
    AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED,
    'This email address has not been verified yet.',
    401,
  );

export const accountSuspended = (): AuthError =>
  new AuthError(AUTH_ERROR_CODES.ACCOUNT_SUSPENDED, 'This account cannot sign in.', 401);

export const accountLocked = (retryAfterSeconds: number): AuthError =>
  new AuthError(
    AUTH_ERROR_CODES.ACCOUNT_LOCKED,
    'Too many failed sign-in attempts. Please try again later.',
    401,
    { details: [{ field: 'account', issue: `locked for ${retryAfterSeconds} more seconds` }] },
  );

export const emailAlreadyRegistered = (): AuthError =>
  new AuthError(
    AUTH_ERROR_CODES.EMAIL_ALREADY_REGISTERED,
    'An account with this email address already exists.',
    409,
  );

/** Covers malformed, expired, revoked and signature-invalid tokens alike. */
export const invalidOrExpiredToken = (): AuthError =>
  new AuthError(
    AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN,
    'The token is invalid or has expired.',
    401,
  );

export const tokenAlreadyUsed = (): AuthError =>
  new AuthError(
    AUTH_ERROR_CODES.TOKEN_ALREADY_USED,
    'The token is invalid or has expired.',
    401,
  );

export const sessionExpired = (): AuthError =>
  new AuthError(AUTH_ERROR_CODES.SESSION_EXPIRED, 'The session has expired.', 401);

export const sessionRevoked = (): AuthError =>
  new AuthError(AUTH_ERROR_CODES.SESSION_REVOKED, 'The session is no longer active.', 401);

export const resourceNotFound = (resource: string): AuthError =>
  new AuthError(AUTH_ERROR_CODES.RESOURCE_NOT_FOUND, `The requested ${resource} was not found.`, 404);

export const methodNotAllowed = (): AuthError =>
  new AuthError(AUTH_ERROR_CODES.METHOD_NOT_ALLOWED, 'Method not allowed for this endpoint.', 405);

export const rateLimited = (retryAfterSeconds: number): AuthError =>
  new AuthError(
    AUTH_ERROR_CODES.RATE_LIMITED,
    'Too many requests. Please slow down and try again.',
    429,
    { details: [{ field: 'request', issue: `retry after ${retryAfterSeconds} seconds` }] },
  );

export const unauthorized = (): AuthError =>
  new AuthError(AUTH_ERROR_CODES.UNAUTHORIZED, 'Authentication is required.', 401);

export const validationError = (details: ValidationIssue[], cause?: unknown): AuthError =>
  new AuthError(
    AUTH_ERROR_CODES.VALIDATION_ERROR,
    'One or more fields are invalid.',
    422,
    { details, cause },
  );

/**
 * Raised only for unexpected faults. The message is generic on purpose:
 * the real detail goes to server logs (`07-API-SPECIFICATION.md` §14).
 */
export const internalError = (cause?: unknown): AuthError =>
  new AuthError(AUTH_ERROR_CODES.INTERNAL_ERROR, 'An unexpected error occurred.', 500, { cause });
