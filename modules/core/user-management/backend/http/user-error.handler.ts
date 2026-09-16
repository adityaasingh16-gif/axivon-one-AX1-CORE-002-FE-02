import { isAuthError } from '../../../authentication/backend/contracts/errors.js';
import { jsonHeaders, type HttpResponse } from '../../../authentication/backend/http/types.js';
import { internalError, isUserManagementError, type UserErrorCode } from '../contracts/errors.js';
import type { ApiFailureResponse } from '../contracts/index.js';

export interface UserErrorResponseFactory {
  fromError(error: unknown, requestId: string): HttpResponse;
}

export interface UserErrorResponseFactoryOptions {
  logger?: (entry: Record<string, unknown>) => void;
  clock?: () => Date;
}

export const createUserErrorResponseFactory = (
  options: UserErrorResponseFactoryOptions = {},
): UserErrorResponseFactory => {
  const logger = options.logger ?? ((entry) => console.error(JSON.stringify(entry)));
  const clock = options.clock ?? (() => new Date());

  return {
    fromError: (error, requestId): HttpResponse => {
      const knownError = isUserManagementError(error) || isAuthError(error);
      const userError = knownError ? error : internalError(error);
      if (!knownError) {
        logger({
          scope: 'user-management',
          event: 'unhandled_error',
          requestId,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      const code: UserErrorCode | string = userError.code;
      const body: ApiFailureResponse = {
        success: false,
        error: {
          code,
          message: userError.message,
          details: userError.details,
          requestId,
        },
        timestamp: clock().toISOString(),
      };
      return { status: userError.httpStatus, headers: jsonHeaders(), body };
    },
  };
};
