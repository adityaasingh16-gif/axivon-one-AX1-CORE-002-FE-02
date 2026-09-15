/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Cross-cutting HTTP middleware for the auth endpoints.
 *
 * `05-SYSTEM-ARCHITECTURE.md` §16: validation, authentication, logging and
 * error handling are shared middleware, not per-endpoint code.
 */

import { randomUUID } from 'node:crypto';
import type { AuthenticationService, SessionVerification } from '../services/auth.service.js';
import { getHeader, jsonHeaders, type HttpRequest, type HttpResponse } from './types.js';

/**
 * Correlation id (`07-API-SPECIFICATION.md` §30). A client-supplied
 * `X-Request-Id` is honoured (bounded, to stop log injection); otherwise one is
 * generated.
 */
export const resolveRequestId = (request: HttpRequest): string => {
  const supplied = (request.requestId ?? getHeader(request, 'x-request-id'))?.trim();
  if (supplied !== undefined && /^[A-Za-z0-9._-]{8,128}$/.test(supplied)) {
    return supplied;
  }
  return `req_${randomUUID()}`;
};

/**
 * Security headers required by `07-API-SPECIFICATION.md` §28.
 * Applied to every auth response by the router.
 */
export const securityHeaders = (): Record<string, string> => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
  'Pragma': 'no-cache',
});

export type AuthGuardResult =
  | { authenticated: true; session: SessionVerification; token: string }
  | { authenticated: false; error: unknown };

export interface AuthGuard {
  /**
   * Verifies the `Authorization: Bearer <access token>` header and confirms the
   * backing session is still live. Never throws — the caller decides how to
   * render the failure.
   */
  authenticate(request: HttpRequest): Promise<AuthGuardResult>;
}

export const createAuthGuard = (service: AuthenticationService): AuthGuard => ({
  authenticate: async (request: HttpRequest): Promise<AuthGuardResult> => {
    const authorization = getHeader(request, 'authorization');
    if (authorization === undefined || authorization.trim().length === 0) {
      try {
        await service.verifySessionToken(undefined);
      } catch (error) {
        return { authenticated: false, error };
      }
      // `verifySessionToken(undefined)` always throws; this is unreachable but
      // keeps the control flow explicit for reviewers.
      return { authenticated: false, error: new Error('unreachable') };
    }

    try {
      const session = await service.verifySessionToken(authorization);
      const token = authorization.replace(/^Bearer\s+/i, '').trim();
      return { authenticated: true, session, token };
    } catch (error) {
      return { authenticated: false, error };
    }
  },
});

/** Builds the 401/404 body for an unauthenticated request via the error factory. */
export const unauthorizedResponse = (error: unknown, toResponse: (error: unknown) => HttpResponse): HttpResponse =>
  toResponse(error);

export { jsonHeaders };
