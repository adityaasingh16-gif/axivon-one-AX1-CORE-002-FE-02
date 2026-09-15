/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Shared test harness.
 *
 * Builds a fully wired module against in-memory doubles with a controllable
 * clock, so expiry, lockout and rate-limit behaviour are deterministic.
 */

import { createInMemoryAuthRepositories } from '../backend/repositories/in-memory.repository.js';
import { createRecordingMailer, type RecordingMailer } from '../backend/services/mailer.service.js';
import { createRecordingAuditSink, type RecordingAuditSink } from '../backend/services/audit.service.js';
import { createInsecurePlainTextHasher, type PasswordHasher } from '../backend/utils/password.hasher.js';
import { createInMemoryRateLimiter } from '../backend/utils/rate.limiter.js';
import { createAuthenticationModule, type AuthenticationModule } from '../backend/factory.js';
import type { AuthModuleConfig, RequestContext } from '../backend/contracts/index.js';

export interface MutableClock {
  now(): Date;
  /** Advances the clock; accepts seconds for readability. */
  advanceSeconds(seconds: number): void;
  set(date: Date): void;
}

export const createMutableClock = (start: Date = new Date('2026-09-10T09:00:00.000Z')): MutableClock => {
  let current = start;
  return {
    now: () => new Date(current.getTime()),
    advanceSeconds: (seconds: number) => {
      current = new Date(current.getTime() + seconds * 1000);
    },
    set: (date: Date) => {
      current = date;
    },
  };
};

export interface TestModule {
  module: AuthenticationModule;
  clock: MutableClock;
  mailer: RecordingMailer;
  audit: RecordingAuditSink;
  context: RequestContext;
  config: AuthModuleConfig;
}

export interface TestModuleOptions {
  /** Rate limits are disabled by default so tests target one behaviour at a time. */
  enableRateLimits?: boolean;
  /** Real scrypt is used when true; the fast test hasher otherwise. */
  useRealHasher?: boolean;
  config?: Partial<AuthModuleConfig>;
}

/** Rate limits off, so a test exercising lockout is not masked by a 429. */
const UNLIMITED_RATE_LIMITS: AuthModuleConfig['rateLimits'] = {
  windowSeconds: 900,
  loginPerIp: 0,
  loginPerEmail: 0,
  registerPerIp: 0,
  forgotPasswordPerIp: 0,
  forgotPasswordPerEmail: 0,
  resetPasswordPerIp: 0,
  verifyEmailPerIp: 0,
};

export const createTestModule = (options: TestModuleOptions = {}): TestModule => {
  const clock = createMutableClock();
  const mailer = createRecordingMailer();
  const audit = createRecordingAuditSink();
  const repositories = createInMemoryAuthRepositories();

  // A fixed, test-only token secret. Never resembles a real credential.
  const baseConfig: Partial<AuthModuleConfig> = {
    issuer: 'AXIVON_ONE_TEST',
    jwtSecret: 'test_access_secret_value_that_is_long_enough_0001',
    jwtRefreshSecret: 'test_refresh_secret_value_that_is_long_enough_001',
    accessTokenTtlSeconds: 900,
    refreshTokenTtlSeconds: 3600,
    emailVerificationTtlSeconds: 3600,
    passwordResetTtlSeconds: 1800,
    maxFailedLoginAttempts: 3,
    lockoutDurationSeconds: 600,
    rotateRefreshTokens: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    rateLimits: options.enableRateLimits === true ? undefined : UNLIMITED_RATE_LIMITS,
    ...options.config,
  };

  // `undefined` entries would overwrite resolved defaults, so drop them.
  const config = Object.fromEntries(
    Object.entries(baseConfig).filter(([, value]) => value !== undefined),
  ) as Partial<AuthModuleConfig>;

  let passwordHasher: PasswordHasher | undefined;
  if (options.useRealHasher !== true) {
    // Imported lazily-free: the insecure hasher is only ever used in tests.
    passwordHasher = createInsecurePlainTextHasher();
  }

  const module = createAuthenticationModule({
    env: undefined,
    config,
    repositories,
    passwordHasher,
    mailer,
    audit,
    rateLimiter: createInMemoryRateLimiter({ nowMs: () => clock.now().getTime() }),
    clock,
  });

  return {
    module,
    clock,
    mailer,
    audit,
    config: module.config,
    context: {
      ipAddress: '203.0.113.7',
      userAgent: 'axivon-test-agent/1.0',
      deviceType: 'web',
      requestId: 'req_test_0001',
    },
  };
};

export const TEST_PASSWORD = 'Sup3rSecret!';
export const TEST_EMAIL = 'ada@axivon.test';

/** Registers a user and completes email verification, leaving an active account. */
export const createVerifiedUser = async (
  harness: TestModule,
  overrides: { email?: string; password?: string } = {},
) => {
  const email = overrides.email ?? TEST_EMAIL;
  const password = overrides.password ?? TEST_PASSWORD;

  await harness.module.service.register(
    { email, password, firstName: 'Ada', lastName: 'Lovelace' },
    harness.context,
  );

  const verificationMail = harness.mailer.lastFor(email);
  if (verificationMail === undefined) {
    throw new Error('expected a verification email to have been sent');
  }

  await harness.module.service.verifyEmail({ token: verificationMail.token }, harness.context);

  return { email, password };
};
