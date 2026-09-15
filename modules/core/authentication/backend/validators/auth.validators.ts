/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Per-endpoint request schemas.
 *
 * Every DTO the auth API accepts is declared exactly once here, which is what
 * makes the `VALIDATION_ERROR` shape identical across endpoints
 * (`07-API-SPECIFICATION.md` §15).
 */

import type {
  ForgotPasswordInput,
  LogoutInput,
  RefreshInput,
  RegisterInput,
  ResetPasswordInput,
  RevokeSessionInput,
  VerifyEmailInput,
} from '../contracts/index.js';
import { authValidators, defineObject } from './schema.js';

export interface AuthRequestSchemas {
  register: ReturnType<typeof defineObject<{
    email: ReturnType<typeof authValidators.email>;
    password: ReturnType<typeof authValidators.password>;
    firstName: ReturnType<typeof authValidators.firstName>;
    lastName: ReturnType<typeof authValidators.lastName>;
  }>>;
  login: ReturnType<typeof defineObject<{
    email: ReturnType<typeof authValidators.email>;
    password: ReturnType<typeof authValidators.loginPassword>;
  }>>;
  logout: ReturnType<typeof defineObject<{
    authorization: ReturnType<typeof authValidators.authorization>;
  }>>;
  refresh: ReturnType<typeof defineObject<{
    refreshToken: ReturnType<typeof authValidators.refreshToken>;
  }>>;
  forgotPassword: ReturnType<typeof defineObject<{
    email: ReturnType<typeof authValidators.email>;
  }>>;
  resetPassword: ReturnType<typeof defineObject<{
    token: ReturnType<typeof authValidators.token>;
    password: ReturnType<typeof authValidators.password>;
  }>>;
  verifyEmail: ReturnType<typeof defineObject<{
    token: ReturnType<typeof authValidators.token>;
  }>>;
  revokeSession: ReturnType<typeof defineObject<{
    sessionId: ReturnType<typeof authValidators.sessionId>;
  }>>;
}

export const createAuthRequestSchemas = (options: {
  minPasswordLength: number;
  maxPasswordLength: number;
}): AuthRequestSchemas => {
  const password = (): ReturnType<typeof authValidators.password> =>
    authValidators.password({
      minLength: options.minPasswordLength,
      maxLength: options.maxPasswordLength,
    });

  return {
    register: defineObject({
      email: authValidators.email(),
      password: password(),
      firstName: authValidators.firstName(),
      lastName: authValidators.lastName(),
    }),

    login: defineObject({
      email: authValidators.email(),
      password: authValidators.loginPassword(),
    }),

    logout: defineObject({
      authorization: authValidators.authorization(),
    }),

    refresh: defineObject({
      refreshToken: authValidators.refreshToken(),
    }),

    forgotPassword: defineObject({
      email: authValidators.email(),
    }),

    resetPassword: defineObject({
      token: authValidators.token(),
      password: password(),
    }),

    verifyEmail: defineObject({
      token: authValidators.token(),
    }),

    revokeSession: defineObject({
      sessionId: authValidators.sessionId(),
    }),
  };
};

/**
 * The parsed payloads, re-exported so the service signature and the HTTP layer
 * cannot disagree about a field name.
 */
export type ParsedRegisterInput = RegisterInput;
export type ParsedLogoutInput = LogoutInput;
export type ParsedRefreshInput = RefreshInput;
export type ParsedForgotPasswordInput = ForgotPasswordInput;
export type ParsedResetPasswordInput = ResetPasswordInput;
export type ParsedVerifyEmailInput = VerifyEmailInput;
export type ParsedRevokeSessionInput = RevokeSessionInput;
