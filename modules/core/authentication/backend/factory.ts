/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Composition root for the authentication module.
 *
 * One call wires the defaults together; every collaborator is replaceable so
 * tests can inject doubles and so the pending technology decisions (database
 * driver, email provider, token library — all `TBD`) can be settled later
 * without touching the service.
 */

import { resolveAuthConfig, type AuthEnvConfigOptions, type EnvSource } from './config/env.js';
import type { AuthModuleConfig } from './contracts/index.js';
import { createAuthController, type AuthController } from './http/auth.controller.js';
import { createAuthRouter, type AuthRouter } from './http/auth.routes.js';
import { createAuthGuard, type AuthGuard } from './http/middleware.js';
import { createInMemoryAuthRepositories } from './repositories/in-memory.repository.js';
import type { AuthRepositories } from './repositories/index.js';
import { AuthenticationService, systemClock, type Clock } from './services/auth.service.js';
import { createConsoleAuditSink, createNoopAuditSink, type AuthAuditSink } from './services/audit.service.js';
import { createRecordingMailer, type Mailer } from './services/mailer.service.js';
import { createScryptPasswordHasher, type PasswordHasher } from './utils/password.hasher.js';
import { createInMemoryRateLimiter, type RateLimiter } from './utils/rate.limiter.js';
import { createHs256TokenProvider, type TokenProvider } from './utils/token.provider.js';
import { createAuthRequestSchemas, type AuthRequestSchemas } from './validators/auth.validators.js';

export interface CreateAuthenticationModuleOptions {
  /** Environment source. Defaults to `process.env`. */
  env?: EnvSource;
  /** Full or partial config override (wins over environment values). */
  config?: Partial<AuthModuleConfig>;
  repositories?: AuthRepositories;
  passwordHasher?: PasswordHasher;
  tokenProvider?: TokenProvider;
  mailer?: Mailer;
  audit?: AuthAuditSink;
  rateLimiter?: RateLimiter;
  clock?: Clock;
}

export interface AuthenticationModule {
  config: AuthModuleConfig;
  service: AuthenticationService;
  schemas: AuthRequestSchemas;
  controller: AuthController;
  router: AuthRouter;
  authGuard: AuthGuard;
  repositories: AuthRepositories;
  mailer: Mailer;
  /** Startup warnings, e.g. development-only secret fallbacks. Surface at boot. */
  warnings: readonly string[];
}

export const createAuthenticationModule = (
  options: CreateAuthenticationModuleOptions = {},
): AuthenticationModule => {
  const envOptions: AuthEnvConfigOptions = { env: options.env, overrides: options.config };
  const { config, warnings } = resolveAuthConfig(envOptions);

  const repositories = options.repositories ?? createInMemoryAuthRepositories();
  const passwordHasher = options.passwordHasher ?? createScryptPasswordHasher();
  const clock = options.clock ?? systemClock();

  const tokenProvider =
    options.tokenProvider ??
    createHs256TokenProvider({
      issuer: config.issuer,
      accessSecret: config.jwtSecret,
      refreshSecret: config.jwtRefreshSecret,
      accessTokenTtlSeconds: config.accessTokenTtlSeconds,
      refreshTokenTtlSeconds: config.refreshTokenTtlSeconds,
      nowSeconds: () => Math.floor(clock.now().getTime() / 1000),
    });

  // Default mailer records messages. It is NOT a production transport — the
  // real provider arrives with the Notifications module (CORE-008).
  const mailer = options.mailer ?? createRecordingMailer();

  const audit =
    options.audit ??
    (process.env['NODE_ENV'] === 'test' ? createNoopAuditSink() : createConsoleAuditSink());

  const rateLimiter = options.rateLimiter ?? createInMemoryRateLimiter();

  const service = new AuthenticationService({
    config,
    repositories,
    passwordHasher,
    tokenProvider,
    mailer,
    audit,
    rateLimiter,
    clock,
  });

  const schemas = createAuthRequestSchemas({
    minPasswordLength: config.minPasswordLength,
    maxPasswordLength: config.maxPasswordLength,
  });

  const controller = createAuthController({ service, schemas });
  const router = createAuthRouter({ controller });
  const authGuard = createAuthGuard(service);

  return {
    config,
    service,
    schemas,
    controller,
    router,
    authGuard,
    repositories,
    mailer,
    warnings,
  };
};
