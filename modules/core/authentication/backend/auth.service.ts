/**
 * Compatibility entrypoint for the original CORE-001 skeleton.
 *
 * The real implementation is now split by responsibility under this backend
 * module. New callers should import from `./index.js` or from the explicit
 * service/repository contracts rather than using this legacy filename.
 */

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

export type { AuthUserRecord as UserRecord } from './contracts/index.js';
