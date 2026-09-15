/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Single-use token generation for email verification and password reset.
 *
 * Only the SHA-256 hash of a token is persisted (`07-API-SPECIFICATION.md`
 * §29: secrets are never logged or stored in usable form), so a database
 * compromise does not hand out working reset links.
 */

import { createHash, randomBytes } from 'node:crypto';

/** 32 bytes = 256 bits of entropy from a CSPRNG. */
export const TOKEN_BYTES = 32;

/** Raw, URL-safe token — this is the value that goes into the email link. */
export const generateRawToken = (bytes: number = TOKEN_BYTES): string =>
  randomBytes(bytes).toString('base64url');

/** Stored value. Lookups compare hashes, never raw tokens. */
export const hashToken = (rawToken: string): string =>
  createHash('sha256').update(rawToken).digest('hex');

/** Stored value for refresh tokens, so a stolen session row is not a session. */
export const hashRefreshToken = (rawToken: string): string => hashToken(rawToken);
