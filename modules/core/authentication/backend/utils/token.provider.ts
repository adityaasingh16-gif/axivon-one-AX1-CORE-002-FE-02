/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Token provider: HS256 signed tokens, implemented on `node:crypto` only.
 *
 * Why hand-rolled rather than a JWT library:
 *  - The repository currently has zero runtime dependencies and the token
 *    mechanism is formally `TBD` (`05-SYSTEM-ARCHITECTURE.md` §12).
 *  - The wire format is standard JWT (HS256), so the `.env.example`
 *    `JWT_SECRET` / `JWT_REFRESH_SECRET` / `JWT_EXPIRES_IN` variables apply
 *    unchanged and a library (`jsonwebtoken`, `jose`) can be swapped in behind
 *    `TokenProvider` without touching the service layer.
 *  - See `docs/adr/ADR-001-token-strategy.md`.
 *
 * Security properties:
 *  - Constant-time signature comparison (`timingSafeEqual`).
 *  - `exp` is mandatory; `nbf`/`iat` honoured when present.
 *  - The header `alg` is pinned to HS256 — an attacker-supplied `alg` is
 *    rejected, which closes the classic `alg: none` confusion attack.
 */

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { invalidOrExpiredToken } from '../contracts/errors.js';

export interface AccessTokenClaims {
  /** Subject — the user id. */
  sub: string;
  /** Unique token id; the session id, used for server-side revocation. */
  jti: string;
  /** Session id (mirrors `jti`, kept explicit for readability). */
  sid: string;
  /** Token kind, so a refresh token can never be replayed as an access token. */
  typ: 'access' | 'refresh';
  /** Issuer. */
  iss: string;
  /** Issued at, seconds since epoch. */
  iat: number;
  /** Expires at, seconds since epoch. */
  exp: number;
  /** Unique per issuance, so rotating at the same second still changes the token. */
  nonce: string;
}

export interface TokenIssueOptions {
  subject: string;
  tokenId: string;
  type: 'access' | 'refresh';
  issuer: string;
  secret: string;
  ttlSeconds: number;
  /** Injectable clock (seconds since epoch) — makes expiry deterministic in tests. */
  nowSeconds?: number;
}

export interface TokenVerifyOptions {
  token: string;
  secret: string;
  issuer: string;
  expectedType: 'access' | 'refresh';
  /** Injectable clock (seconds since epoch). */
  nowSeconds?: number;
  /** Clock skew tolerance, seconds. */
  leewaySeconds?: number;
}

const HS256_HEADER = '{"alg":"HS256","typ":"JWT"}';

const base64UrlEncode = (input: string | Buffer): string =>
  Buffer.from(input).toString('base64url');

const base64UrlDecodeToString = (input: string): string | null => {
  if (!/^[A-Za-z0-9_-]*={0,2}$/.test(input)) {
    return null;
  }
  return Buffer.from(input, 'base64url').toString('utf8');
};

const sign = (signingInput: string, secret: string): string =>
  base64UrlEncode(createHmac('sha256', secret).update(signingInput).digest());

/** Constant-time string comparison that does not leak length differences. */
const safeEqual = (a: string, b: string): boolean => {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  if (bufferA.length !== bufferB.length) {
    // Compare against itself so the timing profile stays uniform.
    timingSafeEqual(bufferA, bufferA);
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readStringClaim = (payload: Record<string, unknown>, key: string): string | null => {
  const value = payload[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
};

const readNumberClaim = (payload: Record<string, unknown>, key: string): number | null => {
  const value = payload[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

/**
 * Issues a signed token. `ttlSeconds <= 0` is a programming error and is
 * rejected rather than silently producing an already-expired token.
 */
export const issueToken = (options: TokenIssueOptions): string => {
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!Number.isFinite(options.ttlSeconds) || options.ttlSeconds <= 0) {
    throw new RangeError('ttlSeconds must be a positive number');
  }
  if (options.secret.length === 0) {
    throw new RangeError('token secret must not be empty');
  }

  const claims: AccessTokenClaims = {
    sub: options.subject,
    jti: options.tokenId,
    sid: options.tokenId,
    typ: options.type,
    iss: options.issuer,
    iat: nowSeconds,
    exp: nowSeconds + Math.floor(options.ttlSeconds),
    nonce: randomUUID(),
  };

  const header = base64UrlEncode(HS256_HEADER);
  const payload = base64UrlEncode(JSON.stringify(claims));
  const signingInput = `${header}.${payload}`;
  return `${signingInput}.${sign(signingInput, options.secret)}`;
};

/**
 * Verifies signature, issuer, token type and expiry.
 * Throws `AuthError(INVALID_OR_EXPIRED_TOKEN)` for every failure reason so
 * callers cannot accidentally distinguish them.
 */
export const verifyToken = (options: TokenVerifyOptions): AccessTokenClaims => {
  const leeway = options.leewaySeconds ?? 0;
  const parts = options.token.split('.');
  if (parts.length !== 3) {
    throw invalidOrExpiredToken();
  }
  const [headerPart, payloadPart, signaturePart] = parts as [string, string, string];

  // Pin the algorithm: the header is checked, never trusted.
  const headerJson = base64UrlDecodeToString(headerPart);
  if (headerJson !== HS256_HEADER) {
    throw invalidOrExpiredToken();
  }

  const expectedSignature = sign(`${headerPart}.${payloadPart}`, options.secret);
  if (!safeEqual(expectedSignature, signaturePart)) {
    throw invalidOrExpiredToken();
  }

  const payloadJson = base64UrlDecodeToString(payloadPart);
  if (payloadJson === null) {
    throw invalidOrExpiredToken();
  }

  let payload: unknown;
  try {
    payload = JSON.parse(payloadJson) as unknown;
  } catch {
    throw invalidOrExpiredToken();
  }
  if (!isRecord(payload)) {
    throw invalidOrExpiredToken();
  }

  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);

  const exp = readNumberClaim(payload, 'exp');
  if (exp === null || nowSeconds > exp + leeway) {
    throw invalidOrExpiredToken();
  }

  const nbf = readNumberClaim(payload, 'nbf');
  if (nbf !== null && nowSeconds + leeway < nbf) {
    throw invalidOrExpiredToken();
  }

  if (readStringClaim(payload, 'iss') !== options.issuer) {
    throw invalidOrExpiredToken();
  }
  if (readStringClaim(payload, 'typ') !== options.expectedType) {
    throw invalidOrExpiredToken();
  }

  const sub = readStringClaim(payload, 'sub');
  const jti = readStringClaim(payload, 'jti');
  const iat = readNumberClaim(payload, 'iat');
  const nonce = readStringClaim(payload, 'nonce');
  if (sub === null || jti === null || iat === null || nonce === null) {
    throw invalidOrExpiredToken();
  }

  return { sub, jti, sid: jti, typ: options.expectedType, iss: options.issuer, iat, exp, nonce };
};

/**
 * Swappable boundary required by `05-SYSTEM-ARCHITECTURE.md` §12 (token
 * strategy TBD): swapping HS256 for RS256, opaque tokens or a library only
 * means providing a different `TokenProvider`.
 */
export interface TokenProvider {
  issueAccessToken(input: { userId: string; sessionId: string }): string;
  issueRefreshToken(input: { userId: string; sessionId: string }): string;
  verifyAccessToken(token: string): AccessTokenClaims;
  verifyRefreshToken(token: string): AccessTokenClaims;
}

export interface Hs256TokenProviderOptions {
  issuer: string;
  accessSecret: string;
  refreshSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  /** Injectable clock, in seconds since epoch. */
  nowSeconds?: () => number;
}

export const createHs256TokenProvider = (options: Hs256TokenProviderOptions): TokenProvider => {
  const clock = options.nowSeconds ?? ((): number => Math.floor(Date.now() / 1000));

  return {
    issueAccessToken: ({ userId, sessionId }) =>
      issueToken({
        subject: userId,
        tokenId: sessionId,
        type: 'access',
        issuer: options.issuer,
        secret: options.accessSecret,
        ttlSeconds: options.accessTokenTtlSeconds,
        nowSeconds: clock(),
      }),
    issueRefreshToken: ({ userId, sessionId }) =>
      issueToken({
        subject: userId,
        tokenId: sessionId,
        type: 'refresh',
        issuer: options.issuer,
        secret: options.refreshSecret,
        ttlSeconds: options.refreshTokenTtlSeconds,
        nowSeconds: clock(),
      }),
    verifyAccessToken: (token) =>
      verifyToken({
        token,
        secret: options.accessSecret,
        issuer: options.issuer,
        expectedType: 'access',
        nowSeconds: clock(),
      }),
    verifyRefreshToken: (token) =>
      verifyToken({
        token,
        secret: options.refreshSecret,
        issuer: options.issuer,
        expectedType: 'refresh',
        nowSeconds: clock(),
      }),
  };
};
