/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Public surface of the backend authentication module.
 *
 * Task AX1-CORE-001-BE-02: core API operations for login, registration,
 * logout, verification, password recovery and session handling.
 *
 * Consumers should import from here rather than reaching into subfolders, so
 * the module boundary (`05-SYSTEM-ARCHITECTURE.md` §8: "exposes well-defined
 * interfaces") stays enforceable in review.
 */

export { MODULE_ID, MODULE_NAME } from '../shared/index.js';

// Contracts ---------------------------------------------------------------
export * from './contracts/index.js';
export * from './contracts/errors.js';

// Configuration -----------------------------------------------------------
export {
  DEFAULT_RATE_LIMITS,
  mapEnvSource,
  parseDurationSeconds,
  processEnvSource,
  resolveAuthConfig,
  type AuthEnvConfigOptions,
  type EnvSource,
  type EnvironmentName,
  type ResolvedAuthEnv,
} from './config/env.js';

// Services ----------------------------------------------------------------
export {
  AuthenticationService,
  newSessionId,
  systemClock,
  type AuthServiceDependencies,
  type Clock,
  type ForgotPasswordResult,
  type RegisterResult,
  type ResetPasswordResult,
  type RevokeAllSessionsResult,
  type RevokeSessionResult,
  type SessionVerification,
  type VerifyEmailResult,
} from './services/auth.service.js';
export { createConsoleAuditSink, createNoopAuditSink, createRecordingAuditSink } from './services/audit.service.js';
export type {
  AuthAuditEntry,
  AuthAuditEvent,
  AuthAuditSink,
  RecordingAuditSink,
} from './services/audit.service.js';
export {
  buildAuthMailMessage,
  createRecordingMailer,
  type AuthMailMessage,
  type AuthMailTemplate,
  type Mailer,
  type RecordingMailer,
} from './services/mailer.service.js';

// Data access -------------------------------------------------------------
export type {
  AuthRepositories,
  CreateSessionInput,
  CreateTokenInput,
  CreateUserInput,
  SessionRepository,
  TokenRepository,
  UserRepository,
} from './repositories/index.js';
export {
  createInMemoryAuthRepositories,
  createInMemorySessionRepository,
  createInMemoryTokenRepository,
  createInMemoryUserRepository,
} from './repositories/in-memory.repository.js';

// Security utilities ------------------------------------------------------
export type { PasswordHasher, ScryptParams } from './utils/password.hasher.js';
export {
  DEFAULT_SCRYPT_PARAMS,
  createInsecurePlainTextHasher,
  createScryptPasswordHasher,
} from './utils/password.hasher.js';
export {
  createHs256TokenProvider,
  issueToken,
  verifyToken,
  type AccessTokenClaims,
  type TokenProvider,
} from './utils/token.provider.js';
export { generateRawToken, hashRefreshToken, hashToken } from './utils/random.js';
export type { RateLimiter, RateLimitDecision } from './utils/rate.limiter.js';
export {
  RATE_LIMIT_BUCKETS,
  createAllowAllRateLimiter,
  createInMemoryRateLimiter,
} from './utils/rate.limiter.js';

// Validation --------------------------------------------------------------
export {
  authValidators,
  defineObject,
  type FieldSpec,
  type InferObject,
} from './validators/schema.js';
export { createAuthRequestSchemas, type AuthRequestSchemas } from './validators/auth.validators.js';

// HTTP layer --------------------------------------------------------------
export type {
  AuthGuard,
  AuthGuardResult,
} from './http/middleware.js';
export { createAuthGuard, resolveRequestId, securityHeaders } from './http/middleware.js';
export {
  consoleErrorLogger,
  createErrorResponseFactory,
  silentErrorLogger,
  type ErrorLogger,
  type ErrorResponseFactory,
} from './http/error.handler.js';
export { createAuthController, type AuthController } from './http/auth.controller.js';
export { createAuthRouter, type AuthRouter, type AuthRouterOptions } from './http/auth.routes.js';
export { createNodeRequestHandler, type NodeAdapterOptions } from './http/node.adapter.js';
export {
  getHeader,
  jsonHeaders,
  type HttpHandler,
  type HttpMethod,
  type HttpRequest,
  type HttpResponse,
} from './http/types.js';

// Composition root --------------------------------------------------------
export {
  createAuthenticationModule,
  type AuthenticationModule,
  type CreateAuthenticationModuleOptions,
} from './factory.js';
