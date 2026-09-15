/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Error -> HTTP response mapping.
 *
 * Implements `07-API-SPECIFICATION.md` §14 exactly:
 *   { "error": { "code", "message", "details", "requestId" } }
 * plus the `success`/`timestamp` fields shipped by `docs/api/README.md`.
 *
 * Nothing internal escapes: `AuthError.cause` and any non-`AuthError` throwable
 * are logged server-side and replaced with a generic 500 message.
 */

import { internalError, isAuthError } from '../contracts/errors.js';
import { AUTH_ERROR_CODES, type ApiFailureResponse, type AuthErrorCode } from '../contracts/index.js';
import { jsonHeaders, type HttpResponse } from './types.js';

export interface ErrorLogger {
  error(entry: Record<string, unknown>): void;
}

export const consoleErrorLogger = (): ErrorLogger => ({
  error: (entry) => {
    console.error(JSON.stringify(entry));
  },
});

export const silentErrorLogger = (): ErrorLogger => ({
  error: () => undefined,
});

export interface ErrorResponseFactoryOptions {
  logger?: ErrorLogger;
  clock?: () => Date;
}

export interface ErrorResponseFactory {
  fromError(error: unknown, requestId: string): HttpResponse;
}

export const createErrorResponseFactory = (
  options: ErrorResponseFactoryOptions = {},
): ErrorResponseFactory => {
  const logger = options.logger ?? consoleErrorLogger();
  const clock = options.clock ?? ((): Date => new Date());

  return {
    fromError: (error: unknown, requestId: string): HttpResponse => {
      const authError = isAuthError(error) ? error : internalError(error);

      if (!isAuthError(error)) {
        // Full detail to the server log only — never to the client (§14).
        logger.error({
          scope: 'authentication',
          event: 'unhandled_error',
          requestId,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }

      const headers: Record<string, string> = jsonHeaders();
      const code: AuthErrorCode = authError.code;

      // `429` carries `Retry-After` where practical (`07-API-SPECIFICATION.md` §27).
      if (code === AUTH_ERROR_CODES.RATE_LIMITED) {
        const detail = authError.details[0];
        const retryAfter = detail === undefined ? 60 : parseRetryAfter(detail.issue);
        headers['Retry-After'] = String(retryAfter);
      }

      const body: ApiFailureResponse = {
        success: false,
        error: {
          code,
          message: authError.message,
          details: authError.details,
          requestId,
        },
        timestamp: clock().toISOString(),
      };

      return { status: authError.httpStatus, headers, body };
    },
  };
};

const parseRetryAfter = (issue: string): number => {
  const match = /(\d+)/.exec(issue);
  const value = match?.[1];
  return value === undefined ? 60 : Number(value);
};
