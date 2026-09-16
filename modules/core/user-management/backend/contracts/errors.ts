import type { ValidationIssue } from './index.js';

export const USER_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_STATUS: 'INVALID_STATUS',
  MEMBERSHIP_NOT_FOUND: 'MEMBERSHIP_NOT_FOUND',
  MEMBERSHIP_ALREADY_EXISTS: 'MEMBERSHIP_ALREADY_EXISTS',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type UserErrorCode = (typeof USER_ERROR_CODES)[keyof typeof USER_ERROR_CODES];

export const USER_ERROR_STATUS: Readonly<Record<UserErrorCode, number>> = {
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  USER_NOT_FOUND: 404,
  EMAIL_ALREADY_EXISTS: 409,
  INVALID_STATUS: 422,
  MEMBERSHIP_NOT_FOUND: 404,
  MEMBERSHIP_ALREADY_EXISTS: 409,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_ERROR: 500,
};

export class UserManagementError extends Error {
  public readonly code: UserErrorCode;
  public readonly httpStatus: number;
  public readonly details: ValidationIssue[];
  public readonly cause?: unknown;

  public constructor(
    code: UserErrorCode,
    message: string,
    options?: { details?: ValidationIssue[]; cause?: unknown },
  ) {
    super(message);
    this.name = 'UserManagementError';
    this.code = code;
    this.httpStatus = USER_ERROR_STATUS[code];
    this.details = options?.details ?? [];
    this.cause = options?.cause;
    Object.setPrototypeOf(this, UserManagementError.prototype);
  }
}

export const isUserManagementError = (value: unknown): value is UserManagementError =>
  value instanceof UserManagementError;

export const validationError = (details: ValidationIssue[], cause?: unknown): UserManagementError =>
  new UserManagementError(USER_ERROR_CODES.VALIDATION_ERROR, 'One or more fields are invalid.', {
    details,
    cause,
  });

export const unauthorized = (): UserManagementError =>
  new UserManagementError(USER_ERROR_CODES.UNAUTHORIZED, 'Authentication is required.');

export const forbidden = (): UserManagementError =>
  new UserManagementError(USER_ERROR_CODES.FORBIDDEN, 'You are not allowed to perform this operation.');

export const methodNotAllowed = (): UserManagementError =>
  new UserManagementError(USER_ERROR_CODES.METHOD_NOT_ALLOWED, 'Method not allowed for this endpoint.');

export const userNotFound = (): UserManagementError =>
  new UserManagementError(USER_ERROR_CODES.USER_NOT_FOUND, 'The requested user was not found.');

export const emailAlreadyExists = (): UserManagementError =>
  new UserManagementError(USER_ERROR_CODES.EMAIL_ALREADY_EXISTS, 'A user with this email already exists.');

export const invalidStatus = (status: string): UserManagementError =>
  new UserManagementError(USER_ERROR_CODES.INVALID_STATUS, `Unsupported user status: ${status}.`);

export const membershipNotFound = (): UserManagementError =>
  new UserManagementError(USER_ERROR_CODES.MEMBERSHIP_NOT_FOUND, 'The requested membership was not found.');

export const membershipAlreadyExists = (): UserManagementError =>
  new UserManagementError(
    USER_ERROR_CODES.MEMBERSHIP_ALREADY_EXISTS,
    'The user already has membership in this organization.',
  );

export const internalError = (cause?: unknown): UserManagementError =>
  new UserManagementError(USER_ERROR_CODES.INTERNAL_ERROR, 'An unexpected error occurred.', { cause });
