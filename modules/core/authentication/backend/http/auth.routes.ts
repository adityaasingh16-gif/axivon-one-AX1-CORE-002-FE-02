/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Route table for the auth API.
 *
 * Routes and methods come from `07-API-SPECIFICATION.md` §16 and §35 (Core API
 * catalog). Action-style paths are used because these are state transitions,
 * not CRUD on a resource (§9 "Special / Action-Style Endpoints").
 *
 * The router is framework-agnostic: it takes `HttpRequest` and returns
 * `HttpResponse`. Adapters for Express/Fastify/Hono are ~10 lines each — see
 * `docs/api/authentication.md` §7.
 */

import { AUTH_ROUTES } from '../contracts/index.js';
import { methodNotAllowed, resourceNotFound } from '../contracts/errors.js';
import { createErrorResponseFactory, type ErrorResponseFactory } from './error.handler.js';
import { resolveRequestId, securityHeaders } from './middleware.js';
import {
  getHeader,
  jsonHeaders,
  type HttpHandler,
  type HttpMethod,
  type HttpRequest,
  type HttpResponse,
} from './types.js';
import type { AuthController } from './auth.controller.js';

interface RouteEntry {
  method: HttpMethod;
  path: string;
  handler: (request: HttpRequest) => Promise<HttpResponse>;
  /** Used in the `Allow` header on 405. */
  operationId: string;
}

export interface AuthRouterOptions {
  controller: AuthController;
  errorResponses?: ErrorResponseFactory;
  clock?: () => Date;
}

export interface AuthRouter {
  handle: HttpHandler;
  /** Registered routes, exposed so docs/tests can assert the contract. */
  routes(): readonly { method: HttpMethod; path: string; operationId: string }[];
}

export const createAuthRouter = (options: AuthRouterOptions): AuthRouter => {
  const errors = options.errorResponses ?? createErrorResponseFactory();
  const { controller } = options;

  const entries: RouteEntry[] = [
    { method: 'POST', path: AUTH_ROUTES.REGISTER, handler: controller.register, operationId: 'auth.register' },
    { method: 'POST', path: AUTH_ROUTES.LOGIN, handler: controller.login, operationId: 'auth.login' },
    { method: 'POST', path: AUTH_ROUTES.LOGOUT, handler: controller.logout, operationId: 'auth.logout' },
    { method: 'POST', path: AUTH_ROUTES.REFRESH, handler: controller.refresh, operationId: 'auth.refresh' },
    {
      method: 'POST',
      path: AUTH_ROUTES.FORGOT_PASSWORD,
      handler: controller.forgotPassword,
      operationId: 'auth.forgotPassword',
    },
    {
      method: 'POST',
      path: AUTH_ROUTES.RESET_PASSWORD,
      handler: controller.resetPassword,
      operationId: 'auth.resetPassword',
    },
    { method: 'POST', path: AUTH_ROUTES.VERIFY, handler: controller.verifyEmail, operationId: 'auth.verifyEmail' },
    {
      // Documented alias: `03-BACKEND-TEAM.md` §7 lists `/auth/verify-email`.
      method: 'POST',
      path: AUTH_ROUTES.VERIFY_EMAIL_ALIAS,
      handler: controller.verifyEmail,
      operationId: 'auth.verifyEmailAlias',
    },
    { method: 'GET', path: AUTH_ROUTES.SESSIONS, handler: controller.listSessions, operationId: 'auth.listSessions' },
    {
      method: 'POST',
      path: AUTH_ROUTES.REVOKE_SESSION,
      handler: controller.revokeSession,
      operationId: 'auth.revokeSession',
    },
    {
      method: 'POST',
      path: AUTH_ROUTES.REVOKE_ALL_SESSIONS,
      handler: controller.revokeAllSessions,
      operationId: 'auth.revokeAllSessions',
    },
  ];

  /** `true` when the request is a CORS preflight — answered locally, no auth. */
  const isPreflight = (request: HttpRequest): boolean =>
    request.method === 'OPTIONS' && getHeader(request, 'access-control-request-method') !== undefined;

  return {
    routes: () =>
      entries.map(({ method, path, operationId }) => ({ method, path, operationId })),

    handle: async (request: HttpRequest): Promise<HttpResponse> => {
      const requestId = resolveRequestId(request);

      if (isPreflight(request)) {
        return {
          status: 204,
          headers: {
            ...securityHeaders(),
            'X-Request-Id': requestId,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Request-Id, X-Device-Type',
            'Access-Control-Max-Age': '600',
          },
          body: null,
        };
      }

      const path = normalisePath(request.path);
      const matchingPath = entries.filter((entry) => entry.path === path);

      if (matchingPath.length === 0) {
        return render(errors.fromError(resourceNotFound('auth endpoint'), requestId), requestId);
      }

      const match = matchingPath.find((entry) => entry.method === request.method);
      if (match === undefined) {
        const allow = matchingPath.map((entry) => entry.method).join(', ');
        const response = errors.fromError(methodNotAllowed(), requestId);
        return render(response, requestId, { Allow: allow });
      }

      try {
        const response = await match.handler(request);
        return render(response, requestId);
      } catch (error) {
        // Handlers already map their own errors; this catches adapter-level faults.
        return render(errors.fromError(error, requestId), requestId);
      }
    },
  };

  function render(response: HttpResponse, requestId: string, extraHeaders?: Record<string, string>): HttpResponse {
    return {
      ...response,
      headers: {
        ...securityHeaders(),
        ...response.headers,
        ...extraHeaders,
        'X-Request-Id': requestId,
      },
    };
  }
};

/** Strips a trailing slash so `/auth/login/` still matches `/auth/login`. */
const normalisePath = (path: string): string => {
  const withoutQuery = path.split('?')[0] ?? path;
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
};

export { jsonHeaders };
