/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Token provider tests — the security-critical signing/verification boundary.
 */

import { describe, expect, it } from 'vitest';
import { AUTH_ERROR_CODES } from '../backend/contracts/index.js';
import { createHs256TokenProvider, issueToken, verifyToken } from '../backend/utils/token.provider.js';

const SECRET = 'unit_test_access_secret_value_long_enough_0001';
const REFRESH_SECRET = 'unit_test_refresh_secret_value_long_enough_001';
const ISSUER = 'AXIVON_ONE_TEST';
const FIXED_NOW = Math.floor(new Date('2026-09-10T09:00:00.000Z').getTime() / 1000);

const baseOptions = {
  secret: SECRET,
  issuer: ISSUER,
  ttlSeconds: 900,
  nowSeconds: FIXED_NOW,
};

const issue = (overrides: Partial<typeof baseOptions> & { type?: 'access' | 'refresh' } = {}): string =>
  issueToken({
    subject: 'user-1',
    tokenId: 'session-1',
    type: overrides.type ?? 'access',
    secret: overrides.secret ?? SECRET,
    issuer: overrides.issuer ?? ISSUER,
    ttlSeconds: overrides.ttlSeconds ?? 900,
    nowSeconds: overrides.nowSeconds ?? FIXED_NOW,
  });

const verify = (token: string, overrides: Partial<Parameters<typeof verifyToken>[0]> = {}) =>
  verifyToken({
    token,
    secret: overrides.secret ?? SECRET,
    issuer: overrides.issuer ?? ISSUER,
    expectedType: overrides.expectedType ?? 'access',
    nowSeconds: overrides.nowSeconds ?? FIXED_NOW,
  });

describe('issueToken / verifyToken', () => {
  it('round-trips the claims', () => {
    const token = issue();
    const claims = verify(token);

    expect(claims.sub).toBe('user-1');
    expect(claims.jti).toBe('session-1');
    expect(claims.typ).toBe('access');
    expect(claims.iss).toBe(ISSUER);
    expect(claims.exp).toBe(FIXED_NOW + 900);
  });

  it('produces the standard three-part JWT shape with a pinned HS256 header', () => {
    const token = issue();
    const [header, payload, signature] = token.split('.');

    expect(token.split('.').length).toBe(3);
    expect(Buffer.from(header as string, 'base64url').toString()).toBe('{"alg":"HS256","typ":"JWT"}');
    expect(JSON.parse(Buffer.from(payload as string, 'base64url').toString())).toMatchObject({
      sub: 'user-1',
    });
    expect((signature as string).length).toBeGreaterThan(20);
  });

  it('rejects a token signed with a different secret', () => {
    const token = issue({ secret: 'a_completely_different_secret_value_000000001' });
    expect(() => verify(token)).toThrowError(
      expect.objectContaining({ code: AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN }),
    );
  });

  it('rejects a tampered payload', () => {
    const token = issue();
    const [header, , signature] = token.split('.') as [string, string, string];
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: 'attacker', jti: 'session-1', typ: 'access', iss: ISSUER, iat: FIXED_NOW, exp: FIXED_NOW + 900 }),
    ).toString('base64url');

    expect(() => verify(`${header}.${forgedPayload}.${signature}`)).toThrowError(
      expect.objectContaining({ code: AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN }),
    );
  });

  it('rejects a forged "alg: none" header', () => {
    const token = issue();
    const [, payload, signature] = token.split('.') as [string, string, string];
    const noneHeader = Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url');

    expect(() => verify(`${noneHeader}.${payload}.${signature}`)).toThrowError(
      expect.objectContaining({ code: AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN }),
    );
  });

  it('rejects an expired token and honours the clock', () => {
    const token = issue();
    expect(() => verify(token, { nowSeconds: FIXED_NOW + 901 })).toThrowError(
      expect.objectContaining({ code: AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN }),
    );
    // Still valid one second before expiry.
    expect(verify(token, { nowSeconds: FIXED_NOW + 899 }).sub).toBe('user-1');
  });

  it('rejects a token from a different issuer', () => {
    const token = issue({ issuer: 'SOME_OTHER_PLATFORM' });
    expect(() => verify(token)).toThrowError(
      expect.objectContaining({ code: AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN }),
    );
  });

  it('rejects a refresh token verified as an access token', () => {
    const refresh = issue({ type: 'refresh' });
    expect(() => verify(refresh, { expectedType: 'access' })).toThrowError(
      expect.objectContaining({ code: AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN }),
    );
  });

  it('rejects malformed tokens without throwing a raw error', () => {
    for (const token of ['', 'abc', 'a.b', 'a.b.c.d', 'not.a.token']) {
      expect(() => verify(token)).toThrowError(
        expect.objectContaining({ code: AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN }),
      );
    }
  });

  it('refuses a non-positive lifetime', () => {
    expect(() => issue({ ttlSeconds: 0 })).toThrowError(RangeError);
    expect(() => issue({ ttlSeconds: -5 })).toThrowError(RangeError);
  });
});

describe('createHs256TokenProvider', () => {
  const provider = createHs256TokenProvider({
    issuer: ISSUER,
    accessSecret: SECRET,
    refreshSecret: REFRESH_SECRET,
    accessTokenTtlSeconds: 900,
    refreshTokenTtlSeconds: 3600,
    nowSeconds: () => FIXED_NOW,
  });

  it('issues access and refresh tokens with separate secrets', () => {
    const access = provider.issueAccessToken({ userId: 'user-1', sessionId: 'session-1' });
    const refresh = provider.issueRefreshToken({ userId: 'user-1', sessionId: 'session-1' });

    expect(provider.verifyAccessToken(access).typ).toBe('access');
    expect(provider.verifyRefreshToken(refresh).typ).toBe('refresh');
    expect(access).not.toBe(refresh);
  });

  it('prevents an access token being used where a refresh token is required', () => {
    const access = provider.issueAccessToken({ userId: 'user-1', sessionId: 'session-1' });
    expect(() => provider.verifyRefreshToken(access)).toThrowError(
      expect.objectContaining({ code: AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN }),
    );
  });
});
