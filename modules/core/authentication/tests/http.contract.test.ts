/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * HTTP contract tests: envelopes, routes, validation and auth middleware.
 */

import { describe, expect, it } from 'vitest';
import { AUTH_ERROR_CODES, AUTH_ROUTES } from '../backend/contracts/index.js';
import type { HttpRequest, HttpResponse } from '../backend/http/types.js';
import { createTestModule, TEST_EMAIL, TEST_PASSWORD } from './helpers.js';

const request = (
  method: HttpRequest['method'],
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): HttpRequest => ({
  method,
  path,
  headers,
  body,
  ipAddress: '203.0.113.7',
  userAgent: 'contract-test/1.0',
});

const bodyOf = (response: HttpResponse): Record<string, any> =>
  response.body as Record<string, any>;

describe('authentication HTTP contract', () => {
  it('returns a standard validation envelope with a correlation id', async () => {
    const harness = createTestModule();

    const response = await harness.module.router.handle(
      request('POST', AUTH_ROUTES.LOGIN, { email: 'not-an-email', password: '' }, { 'X-Request-Id': 'req_http_01' }),
    );
    const body = bodyOf(response);

    expect(response.status).toBe(422);
    expect(response.headers['Content-Type']).toContain('application/json');
    expect(response.headers['X-Request-Id']).toBe('req_http_01');
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(AUTH_ERROR_CODES.VALIDATION_ERROR);
    expect(body.error.requestId).toBe('req_http_01');
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        { field: 'email', issue: 'must be a valid email address' },
        { field: 'password', issue: 'is required' },
      ]),
    );
  });

  it('runs register -> verify -> login -> list sessions -> logout end to end', async () => {
    const harness = createTestModule();

    const register = await harness.module.router.handle(
      request('POST', AUTH_ROUTES.REGISTER, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        firstName: 'Ada',
        lastName: 'Lovelace',
      }),
    );
    expect(register.status).toBe(201);
    expect(bodyOf(register).data.accepted).toBe(true);
    expect(bodyOf(register).data.user).toBeUndefined();

    const verificationToken = harness.mailer.lastFor(TEST_EMAIL)?.token;
    expect(verificationToken).toBeTruthy();

    const verify = await harness.module.router.handle(
      request('POST', AUTH_ROUTES.VERIFY, { token: verificationToken }),
    );
    expect(verify.status).toBe(200);
    expect(bodyOf(verify).data.user.emailVerified).toBe(true);

    const login = await harness.module.router.handle(
      request('POST', AUTH_ROUTES.LOGIN, { email: TEST_EMAIL, password: TEST_PASSWORD }),
    );
    expect(login.status).toBe(200);
    expect(bodyOf(login).data.tokens.accessToken).toBeTruthy();
    expect(bodyOf(login).data.tokens.refreshToken).toBeTruthy();

    const accessToken = bodyOf(login).data.tokens.accessToken as string;
    const sessions = await harness.module.router.handle(
      request('GET', AUTH_ROUTES.SESSIONS, undefined, { Authorization: `Bearer ${accessToken}` }),
    );
    expect(sessions.status).toBe(200);
    expect(bodyOf(sessions).data.sessions).toHaveLength(1);

    const logout = await harness.module.router.handle(
      request('POST', AUTH_ROUTES.LOGOUT, undefined, { Authorization: `Bearer ${accessToken}` }),
    );
    expect(logout.status).toBe(200);
    expect(bodyOf(logout).data.revoked).toBe(true);

    const sessionsAfterLogout = await harness.module.router.handle(
      request('GET', AUTH_ROUTES.SESSIONS, undefined, { Authorization: `Bearer ${accessToken}` }),
    );
    expect(sessionsAfterLogout.status).toBe(401);
    expect(bodyOf(sessionsAfterLogout).error.code).toBe(AUTH_ERROR_CODES.SESSION_REVOKED);
  });

  it('keeps forgot-password responses generic for an unknown address', async () => {
    const harness = createTestModule();

    const response = await harness.module.router.handle(
      request('POST', AUTH_ROUTES.FORGOT_PASSWORD, { email: 'unknown@axivon.test' }),
    );

    expect(response.status).toBe(200);
    expect(bodyOf(response).data.accepted).toBe(true);
    expect(bodyOf(response).message).toContain('If an account exists');
    expect(harness.mailer.sent).toHaveLength(0);
  });

  it('protects session routes and reports unsupported methods consistently', async () => {
    const harness = createTestModule();

    const unauthenticated = await harness.module.router.handle(request('GET', AUTH_ROUTES.SESSIONS));
    expect(unauthenticated.status).toBe(401);
    expect(bodyOf(unauthenticated).error.code).toBe(AUTH_ERROR_CODES.UNAUTHORIZED);

    const wrongMethod = await harness.module.router.handle(request('DELETE', AUTH_ROUTES.LOGIN));
    expect(wrongMethod.status).toBe(405);
    expect(wrongMethod.headers.Allow).toBe('POST');
    expect(bodyOf(wrongMethod).error.code).toBe(AUTH_ERROR_CODES.METHOD_NOT_ALLOWED);
  });

  it('returns 404 for an unknown auth route and handles CORS preflight without authentication', async () => {
    const harness = createTestModule();

    const missing = await harness.module.router.handle(request('GET', '/api/v1/auth/does-not-exist'));
    expect(missing.status).toBe(404);
    expect(bodyOf(missing).error.code).toBe(AUTH_ERROR_CODES.RESOURCE_NOT_FOUND);

    const preflight = await harness.module.router.handle(
      request('OPTIONS', AUTH_ROUTES.LOGIN, undefined, {
        'Access-Control-Request-Method': 'POST',
      }),
    );
    expect(preflight.status).toBe(204);
    expect(preflight.body).toBeNull();
    expect(preflight.headers['Access-Control-Allow-Methods']).toContain('POST');
  });
});
