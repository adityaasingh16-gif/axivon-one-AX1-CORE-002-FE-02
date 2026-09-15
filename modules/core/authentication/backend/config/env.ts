/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Environment-driven configuration.
 *
 * Every value maps to a variable already declared in the repository's
 * `.env.example`, so no new secrets are invented and nothing is hardcoded
 * (`03-BACKEND-TEAM.md` §22: secrets via environment, never committed).
 *
 * Behaviour:
 *  - `production` → missing/weak secrets throw at startup (fail closed).
 *  - otherwise    → documented placeholder defaults are used, and a warning is
 *                   emitted once, so local development is not blocked while the
 *                   Architecture Lead finalises the token decision.
 */

import type { AuthModuleConfig } from '../contracts/index.js';

/** Matches the placeholder shipped in `.env.example` — rejected in production. */
const PLACEHOLDER_PATTERNS: readonly string[] = ['placeholder', 'changeme', 'your_'];

const MIN_SECRET_LENGTH = 32;

const DEV_FALLBACK_ACCESS_SECRET = 'axivon_dev_only_access_secret_do_not_use_in_prod_0001';
const DEV_FALLBACK_REFRESH_SECRET = 'axivon_dev_only_refresh_secret_do_not_use_in_prod_001';

export type EnvironmentName = 'development' | 'test' | 'staging' | 'production';

export interface EnvSource {
  get(key: string): string | undefined;
}

export const processEnvSource = (): EnvSource => ({
  get: (key: string) => process.env[key],
});

export const mapEnvSource = (values: Record<string, string | undefined>): EnvSource => ({
  get: (key: string) => values[key],
});

export interface AuthEnvConfigOptions {
  env?: EnvSource;
  /** Overrides win over environment values. Used by tests. */
  overrides?: Partial<AuthModuleConfig>;
}

/** Parses `1h`, `30m`, `45s`, `7d`, or a bare number of seconds. */
export const parseDurationSeconds = (raw: string | undefined, fallback: number): number => {
  if (raw === undefined || raw.trim().length === 0) {
    return fallback;
  }
  const match = /^(\d+)\s*(ms|s|m|h|d)?$/i.exec(raw.trim());
  if (match === null) {
    return fallback;
  }
  const value = Number(match[1]);
  const unit = (match[2] ?? 's').toLowerCase();

  switch (unit) {
    case 'ms':
      return Math.max(1, Math.floor(value / 1000));
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return fallback;
  }
};

const parseInteger = (raw: string | undefined, fallback: number): number => {
  if (raw === undefined || raw.trim().length === 0) {
    return fallback;
  }
  const value = Number(raw.trim());
  return Number.isInteger(value) && value >= 0 ? value : fallback;
};

const looksLikePlaceholder = (value: string): boolean => {
  const lowered = value.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((pattern) => lowered.includes(pattern));
};

export interface ResolvedAuthEnv {
  config: AuthModuleConfig;
  /** Human-readable problems; empty when the configuration is production-safe. */
  warnings: string[];
  environment: EnvironmentName;
}

export const DEFAULT_RATE_LIMITS: AuthModuleConfig['rateLimits'] = {
  windowSeconds: 900,
  loginPerIp: 20,
  loginPerEmail: 10,
  registerPerIp: 10,
  forgotPasswordPerIp: 10,
  forgotPasswordPerEmail: 5,
  resetPasswordPerIp: 10,
  verifyEmailPerIp: 20,
};

export const resolveAuthConfig = (options: AuthEnvConfigOptions = {}): ResolvedAuthEnv => {
  const env = options.env ?? processEnvSource();
  const warnings: string[] = [];

  const environment = (env.get('NODE_ENV') ?? 'development').trim().toLowerCase() as EnvironmentName;
  const isProduction = environment === 'production';

  const resolveSecret = (key: string, fallback: string, label: string): string => {
    const raw = env.get(key)?.trim();

    if (raw === undefined || raw.length === 0) {
      if (isProduction) {
        throw new Error(`${key} is required in production`);
      }
      warnings.push(`${key} is not set — using a development-only fallback for ${label}`);
      return fallback;
    }

    if (raw.length < MIN_SECRET_LENGTH) {
      if (isProduction) {
        throw new Error(`${key} must be at least ${MIN_SECRET_LENGTH} characters`);
      }
      warnings.push(`${key} is shorter than ${MIN_SECRET_LENGTH} characters — acceptable in ${environment} only`);
    }

    if (looksLikePlaceholder(raw) && isProduction) {
      throw new Error(`${key} still contains a placeholder value`);
    }

    return raw;
  };

  const jwtSecret = resolveSecret('JWT_SECRET', DEV_FALLBACK_ACCESS_SECRET, 'access tokens');
  const jwtRefreshSecret = resolveSecret(
    'JWT_REFRESH_SECRET',
    DEV_FALLBACK_REFRESH_SECRET,
    'refresh tokens',
  );

  if (jwtSecret === jwtRefreshSecret) {
    // Reusing one secret for both token types would let a refresh token be
    // replayed as an access token if `typ` handling ever regressed.
    throw new Error('JWT_REFRESH_SECRET must differ from JWT_SECRET');
  }

  const config: AuthModuleConfig = {
    issuer: env.get('APP_NAME')?.trim() || 'AXIVON_ONE',
    jwtSecret,
    jwtRefreshSecret,
    accessTokenTtlSeconds: parseDurationSeconds(env.get('JWT_EXPIRES_IN'), 3600),
    refreshTokenTtlSeconds: parseDurationSeconds(env.get('JWT_REFRESH_EXPIRES_IN'), 604800),
    emailVerificationTtlSeconds: parseDurationSeconds(env.get('AUTH_EMAIL_VERIFICATION_TTL'), 86400),
    passwordResetTtlSeconds: parseDurationSeconds(env.get('AUTH_PASSWORD_RESET_TTL'), 1800),
    maxFailedLoginAttempts: parseInteger(env.get('AUTH_MAX_FAILED_LOGINS'), 5),
    lockoutDurationSeconds: parseDurationSeconds(env.get('AUTH_LOCKOUT_DURATION'), 900),
    rotateRefreshTokens: (env.get('AUTH_ROTATE_REFRESH_TOKENS') ?? 'true').trim().toLowerCase() !== 'false',
    minPasswordLength: Math.max(8, parseInteger(env.get('AUTH_MIN_PASSWORD_LENGTH'), 8)),
    maxPasswordLength: parseInteger(env.get('AUTH_MAX_PASSWORD_LENGTH'), 128),
    rateLimits: {
      windowSeconds: parseDurationSeconds(env.get('AUTH_RATE_LIMIT_WINDOW'), DEFAULT_RATE_LIMITS.windowSeconds),
      loginPerIp: parseInteger(env.get('AUTH_RATE_LIMIT_LOGIN_IP'), DEFAULT_RATE_LIMITS.loginPerIp),
      loginPerEmail: parseInteger(env.get('AUTH_RATE_LIMIT_LOGIN_EMAIL'), DEFAULT_RATE_LIMITS.loginPerEmail),
      registerPerIp: parseInteger(env.get('AUTH_RATE_LIMIT_REGISTER_IP'), DEFAULT_RATE_LIMITS.registerPerIp),
      forgotPasswordPerIp: parseInteger(
        env.get('AUTH_RATE_LIMIT_FORGOT_IP'),
        DEFAULT_RATE_LIMITS.forgotPasswordPerIp,
      ),
      forgotPasswordPerEmail: parseInteger(
        env.get('AUTH_RATE_LIMIT_FORGOT_EMAIL'),
        DEFAULT_RATE_LIMITS.forgotPasswordPerEmail,
      ),
      resetPasswordPerIp: parseInteger(
        env.get('AUTH_RATE_LIMIT_RESET_IP'),
        DEFAULT_RATE_LIMITS.resetPasswordPerIp,
      ),
      verifyEmailPerIp: parseInteger(
        env.get('AUTH_RATE_LIMIT_VERIFY_IP'),
        DEFAULT_RATE_LIMITS.verifyEmailPerIp,
      ),
    },
    ...options.overrides,
  };

  return { config, warnings, environment };
};
