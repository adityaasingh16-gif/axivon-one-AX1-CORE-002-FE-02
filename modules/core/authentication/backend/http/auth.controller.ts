/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * HTTP controllers — one per auth operation.
 *
 * Responsibilities are deliberately thin (`05-SYSTEM-ARCHITECTURE.md` §16):
 * parse context → validate the body → call the service → wrap in the envelope.
 * All business rules live in `AuthenticationService`.
 */

import type {
  ApiSuccessResponse,
  AuthResult,
  ForgotPasswordInput,
  RefreshInput,
  RegisterInput,
  RequestContext,
  ResetPasswordInput,
  VerifyEmailInput,
} from '../contracts/index.js';
import type { AuthenticationService } from '../services/auth.service.js';
import type { AuthRequestSchemas } from '../validators/auth.validators.js';
import { createAuthGuard, resolveRequestId, securityHeaders, type AuthGuard } from './middleware.js';
import { createErrorResponseFactory, type ErrorResponseFactory } from './error.handler.js';
import { getHeader, jsonHeaders, type HttpRequest, type HttpResponse } from './types.js';

export interface AuthControllerDependencies {
  service: AuthenticationService;
  schemas: AuthRequestSchemas;
  errorResponses?: ErrorResponseFactory;
  authGuard?: AuthGuard;
  clock?: () => Date;
}

export interface AuthController {
  register(request: HttpRequest): Promise<HttpResponse>;
  login(request: HttpRequest): Promise<HttpResponse>;
  logout(request: HttpRequest): Promise<HttpResponse>;
  refresh(request: HttpRequest): Promise<HttpResponse>;
  forgotPassword(request: HttpRequest): Promise<HttpResponse>;
  resetPassword(request: HttpRequest): Promise<HttpResponse>;
  verifyEmail(request: HttpRequest): Promise<HttpResponse>;
  listSessions(request: HttpRequest): Promise<HttpResponse>;
  revokeSession(request: HttpRequest): Promise<HttpResponse>;
  revokeAllSessions(request: HttpRequest): Promise<HttpResponse>;
}

export const createAuthController = (
  dependencies: AuthControllerDependencies,
): AuthController => {
  const { service, schemas } = dependencies;
  const errors = dependencies.errorResponses ?? createErrorResponseFactory();
  const guard = dependencies.authGuard ?? createAuthGuard(service);
  const clock = dependencies.clock ?? ((): Date => new Date());

  /** Wraps a successful payload in the documented envelope (§13). */
  const ok = <T>(data: T, message: string, requestId: string, meta?: Record<string, unknown>): HttpResponse => {
    const body: ApiSuccessResponse<T> = {
      success: true,
      data,
      message,
      timestamp: clock().toISOString(),
      ...(meta === undefined ? {} : { meta }),
    };
    const headers = jsonHeaders({ ...securityHeaders(), 'X-Request-Id': requestId });
    return { status: 200, headers, body };
  };

  const fail = (error: unknown, requestId: string): HttpResponse => {
    const response = errors.fromError(error, requestId);
    return {
      ...response,
      headers: { ...response.headers, ...securityHeaders(), 'X-Request-Id': requestId },
    };
  };

  const contextOf = (request: HttpRequest, requestId: string): RequestContext => ({
    ipAddress: request.ipAddress,
    userAgent: request.userAgent ?? getHeader(request, 'user-agent'),
    deviceType: getHeader(request, 'x-device-type') === 'mobile' ? 'mobile' : 'web',
    requestId,
  });

  /**
   * 201 for resource creation, 200 otherwise. `POST /auth/register` is the only
   * endpoint that creates a resource; every other action endpoint returns 200.
   */
  const created = <T>(data: T, message: string, requestId: string): HttpResponse => {
    const response = ok(data, message, requestId);
    return { ...response, status: 201 };
  };

  return {
    // POST /auth/register ------------------------------------------------
    register: async (request) => {
      const requestId = resolveRequestId(request);
      try {
        const input = schemas.register.parse(request.body) as unknown as RegisterInput;
        await service.register(input, contextOf(request, requestId));

        // NOTE: the response is identical whether or not the account was
        // created, so the endpoint cannot be used to enumerate accounts.
        // Do not return `result.user`: on a duplicate address it would expose
        // the existing user's id/status and turn registration into an account
        // enumeration oracle. Both paths return the same static data shape.
        return created(
          { accepted: true },
          'If that email address is available, a verification link has been sent.',
          requestId,
        );
      } catch (error) {
        return fail(error, requestId);
      }
    },

    // POST /auth/verify (alias: /auth/verify-email) ----------------------
    verifyEmail: async (request) => {
      const requestId = resolveRequestId(request);
      try {
        const input = schemas.verifyEmail.parse(request.body) as unknown as VerifyEmailInput;
        const result = await service.verifyEmail(input, contextOf(request, requestId));
        return ok({ user: result.user }, 'Email address verified.', requestId);
      } catch (error) {
        return fail(error, requestId);
      }
    },

    // POST /auth/login ---------------------------------------------------
    login: async (request) => {
      const requestId = resolveRequestId(request);
      try {
        const input = schemas.login.parse(request.body);
        const result: AuthResult = await service.login(
          { email: input.email, password: input.password },
          contextOf(request, requestId),
        );
        return ok(
          { user: result.user, tokens: result.tokens, session: result.session },
          'Signed in successfully.',
          requestId,
          { tokenType: 'Bearer', expiresIn: result.tokens.expiresIn },
        );
      } catch (error) {
        return fail(error, requestId);
      }
    },

    // POST /auth/refresh -------------------------------------------------
    refresh: async (request) => {
      const requestId = resolveRequestId(request);
      try {
        const input = schemas.refresh.parse(request.body) as unknown as RefreshInput;
        const result = await service.refresh(input, contextOf(request, requestId));
        return ok(
          { user: result.user, tokens: result.tokens, session: result.session },
          'Tokens refreshed.',
          requestId,
          { tokenType: 'Bearer', expiresIn: result.tokens.expiresIn },
        );
      } catch (error) {
        return fail(error, requestId);
      }
    },

    // POST /auth/logout --------------------------------------------------
    logout: async (request) => {
      const requestId = resolveRequestId(request);
      try {
        const authorization = getHeader(request, 'authorization');
        const result = await service.logout({ authorization }, contextOf(request, requestId));
        return ok({ revoked: result.revoked }, 'Signed out successfully.', requestId);
      } catch (error) {
        return fail(error, requestId);
      }
    },

    // POST /auth/forgot-password -----------------------------------------
    forgotPassword: async (request) => {
      const requestId = resolveRequestId(request);
      try {
        const input = schemas.forgotPassword.parse(request.body) as unknown as ForgotPasswordInput;
        await service.forgotPassword(input, contextOf(request, requestId));
        // Generic response whether or not the account exists (§16).
        return ok(
          { accepted: true },
          'If an account exists for that email address, a password reset link has been sent.',
          requestId,
        );
      } catch (error) {
        return fail(error, requestId);
      }
    },

    // POST /auth/reset-password ------------------------------------------
    resetPassword: async (request) => {
      const requestId = resolveRequestId(request);
      try {
        const input = schemas.resetPassword.parse(request.body) as unknown as ResetPasswordInput;
        await service.resetPassword(input, contextOf(request, requestId));
        return ok(
          { passwordChanged: true },
          'Password updated. All other sessions have been signed out.',
          requestId,
        );
      } catch (error) {
        return fail(error, requestId);
      }
    },

    // GET /auth/sessions (authenticated) ---------------------------------
    listSessions: async (request) => {
      const requestId = resolveRequestId(request);
      try {
        const guarded = await guard.authenticate(request);
        if (!guarded.authenticated) {
          return fail(guarded.error, requestId);
        }
        const sessions = await service.listSessions(guarded.session.userId);
        return ok({ sessions }, 'Active sessions retrieved.', requestId, {
          total: sessions.length,
        });
      } catch (error) {
        return fail(error, requestId);
      }
    },

    // POST /auth/sessions/revoke (authenticated) -------------------------
    revokeSession: async (request) => {
      const requestId = resolveRequestId(request);
      try {
        const guarded = await guard.authenticate(request);
        if (!guarded.authenticated) {
          return fail(guarded.error, requestId);
        }
        const input = schemas.revokeSession.parse(request.body);
        const result = await service.revokeSession(
          guarded.session.userId,
          input.sessionId,
          contextOf(request, requestId),
        );
        return ok(result, 'Session signed out.', requestId);
      } catch (error) {
        return fail(error, requestId);
      }
    },

    // POST /auth/sessions/revoke-all (authenticated) ---------------------
    revokeAllSessions: async (request) => {
      const requestId = resolveRequestId(request);
      try {
        const guarded = await guard.authenticate(request);
        if (!guarded.authenticated) {
          return fail(guarded.error, requestId);
        }
        const result = await service.revokeAllSessions(
          guarded.session.userId,
          contextOf(request, requestId),
        );
        return ok(result, 'All sessions signed out.', requestId);
      } catch (error) {
        return fail(error, requestId);
      }
    },
  };
};
