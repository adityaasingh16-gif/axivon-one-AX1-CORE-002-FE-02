/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Unit tests for the core auth operations (Task AX1-CORE-001-BE-02).
 *
 * These exercise the real `AuthenticationService` against in-memory
 * repositories — not a re-implementation — so a regression in login,
 * registration, logout, verification, password recovery or session handling
 * fails here.
 */

import { describe, expect, it } from 'vitest';
import { AUTH_ERROR_CODES } from '../backend/contracts/index.js';
import { isAuthError } from '../backend/contracts/errors.js';
import { createVerifiedUser, createTestModule, TEST_EMAIL, TEST_PASSWORD } from './helpers.js';

const codeOf = (error: unknown): string => {
  if (!isAuthError(error)) {
    return `not-an-auth-error: ${String(error)}`;
  }
  return error.code;
};

describe('registration', () => {
  it('creates a pending account and emails a verification token', async () => {
    const harness = createTestModule();

    const result = await harness.module.service.register(
      { email: TEST_EMAIL, password: TEST_PASSWORD, firstName: 'Ada', lastName: 'Lovelace' },
      harness.context,
    );

    expect(result.created).toBe(true);
    expect(result.user.status).toBe('pending');
    expect(result.user.emailVerified).toBe(false);
    expect(result.user.email).toBe(TEST_EMAIL);
    // The password hash must never reach the caller.
    expect(JSON.stringify(result.user)).not.toContain('passwordHash');

    const mail = harness.mailer.lastFor(TEST_EMAIL);
    expect(mail?.template).toBe('email_verification');
    expect(mail?.token.length).toBeGreaterThan(20);
  });

  it('normalises the email to lowercase', async () => {
    const harness = createTestModule();

    const result = await harness.module.service.register(
      { email: '  Ada@Axivon.TEST ', password: TEST_PASSWORD, firstName: 'Ada', lastName: 'L' },
      harness.context,
    );

    expect(result.user.email).toBe(TEST_EMAIL);
  });

  it('returns the same shape for a duplicate email without creating a second account', async () => {
    const harness = createTestModule();
    const payload = { email: TEST_EMAIL, password: TEST_PASSWORD, firstName: 'Ada', lastName: 'L' };

    const first = await harness.module.service.register(payload, harness.context);
    const second = await harness.module.service.register(payload, harness.context);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.user.id).toBe(first.user.id);
    // No second verification email — that would confirm the account exists.
    expect(harness.mailer.sent.length).toBe(1);
  });

  it('records the registration in the audit trail', async () => {
    const harness = createTestModule();
    await harness.module.service.register(
      { email: TEST_EMAIL, password: TEST_PASSWORD, firstName: 'Ada', lastName: 'L' },
      harness.context,
    );

    const events = harness.audit.entries.map((entry) => entry.event);
    expect(events).toContain('auth.register');
  });
});

describe('email verification', () => {
  it('activates a pending account', async () => {
    const harness = createTestModule();
    await harness.module.service.register(
      { email: TEST_EMAIL, password: TEST_PASSWORD, firstName: 'Ada', lastName: 'L' },
      harness.context,
    );
    const token = harness.mailer.lastFor(TEST_EMAIL)?.token as string;

    const result = await harness.module.service.verifyEmail({ token }, harness.context);

    expect(result.user.emailVerified).toBe(true);
    expect(result.user.status).toBe('active');
  });

  it('rejects a token used twice', async () => {
    const harness = createTestModule();
    await harness.module.service.register(
      { email: TEST_EMAIL, password: TEST_PASSWORD, firstName: 'Ada', lastName: 'L' },
      harness.context,
    );
    const token = harness.mailer.lastFor(TEST_EMAIL)?.token as string;

    await harness.module.service.verifyEmail({ token }, harness.context);

    await expect(harness.module.service.verifyEmail({ token }, harness.context)).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.TOKEN_ALREADY_USED,
    });
  });

  it('rejects an expired token', async () => {
    const harness = createTestModule();
    await harness.module.service.register(
      { email: TEST_EMAIL, password: TEST_PASSWORD, firstName: 'Ada', lastName: 'L' },
      harness.context,
    );
    const token = harness.mailer.lastFor(TEST_EMAIL)?.token as string;

    harness.clock.advanceSeconds(harness.config.emailVerificationTtlSeconds + 1);

    await expect(harness.module.service.verifyEmail({ token }, harness.context)).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN,
    });
  });

  it('rejects an unknown token', async () => {
    const harness = createTestModule();
    await expect(
      harness.module.service.verifyEmail({ token: 'not-a-real-token-value' }, harness.context),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN });
  });
});

describe('login', () => {
  it('issues access and refresh tokens plus a session for valid credentials', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);

    const result = await harness.module.service.login(
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      harness.context,
    );

    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();
    expect(result.tokens.expiresIn).toBe(harness.config.accessTokenTtlSeconds);
    expect(result.session.id).toBeTruthy();
    expect(result.user.email).toBe(TEST_EMAIL);
    expect(result.session.ipAddress).toBe(harness.context.ipAddress);
  });

  it('does not leak the password hash or the raw refresh token in the session', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);

    const result = await harness.module.service.login(
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      harness.context,
    );

    const stored = await harness.module.repositories.sessions.findById(result.session.id);
    expect(stored?.refreshTokenHash).not.toBe(result.tokens.refreshToken);
    expect(JSON.stringify(result.session)).not.toContain(result.tokens.refreshToken);
  });

  it('returns an identical generic error for a wrong password and an unknown user', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);

    const wrongPassword = await harness.module.service
      .login({ email: TEST_EMAIL, password: 'WrongPassw0rd!' }, harness.context)
      .catch((error: unknown) => error);
    const unknownUser = await harness.module.service
      .login({ email: 'nobody@axivon.test', password: TEST_PASSWORD }, harness.context)
      .catch((error: unknown) => error);

    expect(codeOf(wrongPassword)).toBe(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
    expect(codeOf(unknownUser)).toBe(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
    expect(isAuthError(wrongPassword) ? wrongPassword.message : '').toBe(
      isAuthError(unknownUser) ? unknownUser.message : '',
    );
  });

  it('refuses login before the email is verified', async () => {
    const harness = createTestModule();
    await harness.module.service.register(
      { email: TEST_EMAIL, password: TEST_PASSWORD, firstName: 'Ada', lastName: 'L' },
      harness.context,
    );

    await expect(
      harness.module.service.login({ email: TEST_EMAIL, password: TEST_PASSWORD }, harness.context),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED });
  });

  it('locks the account after the configured number of failures', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);

    for (let attempt = 0; attempt < harness.config.maxFailedLoginAttempts; attempt += 1) {
      await harness.module.service
        .login({ email: TEST_EMAIL, password: 'WrongPassw0rd!' }, harness.context)
        .catch(() => undefined);
    }

    // The correct password is now refused while the lockout is in force.
    await expect(
      harness.module.service.login({ email: TEST_EMAIL, password: TEST_PASSWORD }, harness.context),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.ACCOUNT_LOCKED });

    // ...and allowed again once it expires.
    harness.clock.advanceSeconds(harness.config.lockoutDurationSeconds + 1);
    const result = await harness.module.service.login(
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      harness.context,
    );
    expect(result.user.email).toBe(TEST_EMAIL);
  });

  it('rejects a client-supplied organizationId instead of trusting it', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);

    await expect(
      harness.module.service.login(
        { email: TEST_EMAIL, password: TEST_PASSWORD, organizationId: 'some-tenant-id' },
        harness.context,
      ),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.VALIDATION_ERROR });
  });

  it('records failed and successful logins in the audit trail', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);

    await harness.module.service
      .login({ email: TEST_EMAIL, password: 'WrongPassw0rd!' }, harness.context)
      .catch(() => undefined);
    await harness.module.service.login({ email: TEST_EMAIL, password: TEST_PASSWORD }, harness.context);

    const events = harness.audit.entries.map((entry) => entry.event);
    expect(events).toContain('auth.login.failure');
    expect(events).toContain('auth.login.success');
  });
});

describe('logout', () => {
  it('revokes the session so the access token stops working', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);
    const login = await harness.module.service.login(
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      harness.context,
    );

    const result = await harness.module.service.logout(
      { authorization: `Bearer ${login.tokens.accessToken}` },
      harness.context,
    );
    expect(result.revoked).toBe(true);

    await expect(
      harness.module.service.verifySessionToken(`Bearer ${login.tokens.accessToken}`),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.SESSION_REVOKED });
  });

  it('is idempotent when the session is already gone', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);
    const login = await harness.module.service.login(
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      harness.context,
    );

    await harness.module.repositories.sessions.revoke(login.session.id, harness.clock.now().toISOString());

    const result = await harness.module.service.logout(
      { authorization: `Bearer ${login.tokens.accessToken}` },
      harness.context,
    );
    expect(result.revoked).toBe(false);
  });

  it('rejects a missing Authorization header', async () => {
    const harness = createTestModule();
    await expect(harness.module.service.logout({}, harness.context)).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.UNAUTHORIZED,
    });
  });
});

describe('token refresh', () => {
  it('rotates the refresh token and issues a new access token', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);
    const login = await harness.module.service.login(
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      harness.context,
    );

    const refreshed = await harness.module.service.refresh(
      { refreshToken: login.tokens.refreshToken },
      harness.context,
    );

    expect(refreshed.tokens.refreshToken).not.toBe(login.tokens.refreshToken);
    expect(refreshed.tokens.accessToken).toBeTruthy();
    expect(refreshed.session.id).toBe(login.session.id);
  });

  it('treats replay of a rotated refresh token as theft and revokes every session', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);
    const login = await harness.module.service.login(
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      harness.context,
    );

    await harness.module.service.refresh({ refreshToken: login.tokens.refreshToken }, harness.context);

    // The old token is replayed by an attacker.
    await expect(
      harness.module.service.refresh({ refreshToken: login.tokens.refreshToken }, harness.context),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.SESSION_REVOKED });

    const sessions = await harness.module.service.listSessions(
      (await harness.module.repositories.users.findByEmail(TEST_EMAIL))?.id as string,
    );
    expect(sessions.length).toBe(0);

    const events = harness.audit.entries.map((entry) => entry.event);
    expect(events).toContain('auth.token.reuse_detected');
  });

  it('rejects an access token presented as a refresh token', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);
    const login = await harness.module.service.login(
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      harness.context,
    );

    await expect(
      harness.module.service.refresh({ refreshToken: login.tokens.accessToken }, harness.context),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN });
  });

  it('rejects an expired refresh token', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);
    const login = await harness.module.service.login(
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      harness.context,
    );

    harness.clock.advanceSeconds(harness.config.refreshTokenTtlSeconds + 1);

    await expect(
      harness.module.service.refresh({ refreshToken: login.tokens.refreshToken }, harness.context),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN });
  });
});

describe('password recovery', () => {
  it('emails a reset token for a known account', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);

    const result = await harness.module.service.forgotPassword({ email: TEST_EMAIL }, harness.context);

    expect(result.accepted).toBe(true);
    const mail = harness.mailer.lastFor(TEST_EMAIL);
    expect(mail?.template).toBe('password_reset');
  });

  it('returns the same generic response for an unknown email and sends nothing', async () => {
    const harness = createTestModule();

    const result = await harness.module.service.forgotPassword(
      { email: 'nobody@axivon.test' },
      harness.context,
    );

    expect(result.accepted).toBe(true);
    expect(harness.mailer.sent.length).toBe(0);
  });

  it('sets a new password, revokes sessions and invalidates the token', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);
    const login = await harness.module.service.login(
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      harness.context,
    );

    await harness.module.service.forgotPassword({ email: TEST_EMAIL }, harness.context);
    const token = harness.mailer.lastFor(TEST_EMAIL)?.token as string;

    const reset = await harness.module.service.resetPassword(
      { token, password: 'BrandNewPass1!' },
      harness.context,
    );
    expect(reset.revokedSessions).toBe(1);

    // The old password no longer works, the new one does.
    await expect(
      harness.module.service.login({ email: TEST_EMAIL, password: TEST_PASSWORD }, harness.context),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.INVALID_CREDENTIALS });

    const newLogin = await harness.module.service.login(
      { email: TEST_EMAIL, password: 'BrandNewPass1!' },
      harness.context,
    );
    expect(newLogin.user.email).toBe(TEST_EMAIL);

    // The pre-reset session is dead.
    await expect(
      harness.module.service.verifySessionToken(`Bearer ${login.tokens.accessToken}`),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.SESSION_REVOKED });

    // The token is single-use.
    await expect(
      harness.module.service.resetPassword({ token, password: 'AnotherPass1!' }, harness.context),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.TOKEN_ALREADY_USED });
  });

  it('rejects an expired reset token', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);
    await harness.module.service.forgotPassword({ email: TEST_EMAIL }, harness.context);
    const token = harness.mailer.lastFor(TEST_EMAIL)?.token as string;

    harness.clock.advanceSeconds(harness.config.passwordResetTtlSeconds + 1);

    await expect(
      harness.module.service.resetPassword({ token, password: 'BrandNewPass1!' }, harness.context),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN });
  });

  it('supersedes an earlier reset link when a new one is requested', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);

    await harness.module.service.forgotPassword({ email: TEST_EMAIL }, harness.context);
    const firstToken = harness.mailer.lastFor(TEST_EMAIL)?.token as string;

    await harness.module.service.forgotPassword({ email: TEST_EMAIL }, harness.context);
    const secondToken = harness.mailer.sent.at(-1)?.token as string;
    expect(secondToken).not.toBe(firstToken);

    await expect(
      harness.module.service.resetPassword({ token: firstToken, password: 'BrandNewPass1!' }, harness.context),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN });
  });
});

describe('session handling', () => {
  it('lists only live sessions belonging to the authenticated user', async () => {
    const harness = createTestModule();
    const ada = await createVerifiedUser(harness, { email: 'ada@axivon.test' });
    await createVerifiedUser(harness, { email: 'grace@axivon.test' });

    await harness.module.service.login({ email: ada.email, password: ada.password }, harness.context);
    await harness.module.service.login({ email: ada.email, password: ada.password }, harness.context);
    await harness.module.service.login(
      { email: 'grace@axivon.test', password: TEST_PASSWORD },
      harness.context,
    );

    const adaId = (await harness.module.repositories.users.findByEmail('ada@axivon.test'))?.id as string;
    const sessions = await harness.module.service.listSessions(adaId);

    expect(sessions.length).toBe(2);
    expect(sessions.every((session) => session.ipAddress === harness.context.ipAddress)).toBe(true);
  });

  it('revokes a single session', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);
    const first = await harness.module.service.login(
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      harness.context,
    );
    const second = await harness.module.service.login(
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      harness.context,
    );

    await harness.module.service.revokeSession(first.user.id, first.session.id, harness.context);

    await expect(
      harness.module.service.verifySessionToken(`Bearer ${first.tokens.accessToken}`),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.SESSION_REVOKED });

    // The other session is untouched.
    const stillValid = await harness.module.service.verifySessionToken(
      `Bearer ${second.tokens.accessToken}`,
    );
    expect(stillValid.sessionId).toBe(second.session.id);
  });

  it('reports another user\'s session as not found rather than forbidden', async () => {
    const harness = createTestModule();
    const ada = await createVerifiedUser(harness, { email: 'ada@axivon.test' });
    const grace = await createVerifiedUser(harness, { email: 'grace@axivon.test' });

    const graceLogin = await harness.module.service.login(
      { email: grace.email, password: grace.password },
      harness.context,
    );

    await expect(
      harness.module.service.revokeSession(
        (await harness.module.repositories.users.findByEmail(ada.email))?.id as string,
        graceLogin.session.id,
        harness.context,
      ),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.RESOURCE_NOT_FOUND });
  });

  it('revokes every session at once', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);
    const login = await harness.module.service.login(
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      harness.context,
    );

    const result = await harness.module.service.revokeAllSessions(login.user.id, harness.context);
    expect(result.revokedSessions).toBe(1);

    const remaining = await harness.module.service.listSessions(login.user.id);
    expect(remaining.length).toBe(0);
  });

  it('expires a session once its lifetime passes', async () => {
    const harness = createTestModule();
    await createVerifiedUser(harness);
    const login = await harness.module.service.login(
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      harness.context,
    );

    harness.clock.advanceSeconds(harness.config.refreshTokenTtlSeconds + 1);

    await expect(
      harness.module.service.verifySessionToken(`Bearer ${login.tokens.accessToken}`),
    ).rejects.toMatchObject({ code: AUTH_ERROR_CODES.INVALID_OR_EXPIRED_TOKEN });
  });

  it('rejects a request with no Authorization header', async () => {
    const harness = createTestModule();
    await expect(harness.module.service.verifySessionToken(undefined)).rejects.toMatchObject({
      code: AUTH_ERROR_CODES.UNAUTHORIZED,
    });
  });
});

describe('rate limiting', () => {
  it('returns 429 with a retry hint once the login limit is exceeded', async () => {
    const harness = createTestModule({
      enableRateLimits: true,
      config: {
        rateLimits: {
          windowSeconds: 900,
          loginPerIp: 3,
          loginPerEmail: 0,
          registerPerIp: 0,
          forgotPasswordPerIp: 0,
          forgotPasswordPerEmail: 0,
          resetPasswordPerIp: 0,
          verifyEmailPerIp: 0,
        },
      },
    });
    await createVerifiedUser(harness);

    let rateLimitedError: unknown;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await harness.module.service.login(
          { email: TEST_EMAIL, password: 'WrongPassw0rd!' },
          harness.context,
        );
      } catch (error) {
        if (codeOf(error) === AUTH_ERROR_CODES.RATE_LIMITED) {
          rateLimitedError = error;
          break;
        }
      }
    }

    expect(codeOf(rateLimitedError)).toBe(AUTH_ERROR_CODES.RATE_LIMITED);
    expect(isAuthError(rateLimitedError) ? rateLimitedError.httpStatus : 0).toBe(429);
  });
});
