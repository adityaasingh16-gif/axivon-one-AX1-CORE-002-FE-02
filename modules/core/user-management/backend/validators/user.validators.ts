import { validationError } from '../contracts/errors.js';
import type {
  AddMembershipInput,
  CreateUserInput,
  MembershipStatus,
  UpdateProfileInput,
  UpdateUserInput,
  UpdateUserStatusInput,
  UserListQuery,
  UserStatus,
  ValidationIssue,
  UUID,
} from '../contracts/index.js';

const USER_STATUSES: readonly UserStatus[] = ['active', 'inactive', 'suspended', 'pending'];
const MEMBERSHIP_STATUSES: readonly MembershipStatus[] = ['active', 'inactive', 'invited', 'suspended'];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown): value is string => typeof value === 'string';

const requiredText = (value: unknown, field: string, maxLength: number, issues: ValidationIssue[]): string => {
  if (!text(value) || value.trim().length === 0) {
    issues.push({ field, issue: 'is required' });
    return '';
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    issues.push({ field, issue: `must be at most ${maxLength} characters` });
  }
  return trimmed;
};

const optionalText = (
  value: unknown,
  field: string,
  maxLength: number,
  issues: ValidationIssue[],
): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (!text(value)) {
    issues.push({ field, issue: 'must be a string or null' });
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    issues.push({ field, issue: `must be at most ${maxLength} characters` });
  }
  return trimmed;
};

const optionalNonNullText = (
  value: unknown,
  field: string,
  maxLength: number,
  issues: ValidationIssue[],
): string | undefined => {
  if (value === null) {
    issues.push({ field, issue: 'must be a string' });
    return undefined;
  }
  const parsed = optionalText(value, field, maxLength, issues);
  return typeof parsed === 'string' ? parsed : undefined;
};

const validateEmail = (value: unknown, issues: ValidationIssue[]): string => {
  const email = requiredText(value, 'email', 255, issues).toLowerCase();
  if (email.length > 0 && !EMAIL_PATTERN.test(email)) {
    issues.push({ field: 'email', issue: 'must be a valid email address' });
  }
  return email;
};

const validateUuid = (value: unknown, field: string, issues: ValidationIssue[]): UUID => {
  const id = requiredText(value, field, 80, issues);
  if (id.length > 0 && !UUID_PATTERN.test(id)) {
    issues.push({ field, issue: 'must be a UUID' });
  }
  return id;
};

const validatePassword = (value: unknown, issues: ValidationIssue[]): string => {
  if (!text(value) || value.length < 8) {
    issues.push({ field: 'password', issue: 'must be at least 8 characters' });
    return '';
  }
  if (value.length > 128) {
    issues.push({ field: 'password', issue: 'must be at most 128 characters' });
  }
  if (/\s/.test(value)) {
    issues.push({ field: 'password', issue: 'must not contain whitespace' });
  }
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    issues.push({ field: 'password', issue: 'must contain at least one letter and one number' });
  }
  return value;
};

const finish = <T>(value: T, issues: ValidationIssue[]): T => {
  if (issues.length > 0) {
    throw validationError(issues);
  }
  return value;
};

export const parseCreateUser = (input: unknown): CreateUserInput => {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) {
    throw validationError([{ field: 'body', issue: 'must be an object' }]);
  }
  const email = validateEmail(input.email, issues);
  const password = validatePassword(input.password, issues);
  const firstName = requiredText(input.firstName, 'firstName', 100, issues);
  const lastName = requiredText(input.lastName, 'lastName', 100, issues);
  const phoneValue = optionalText(input.phone, 'phone', 32, issues);
  const avatarUrlValue = optionalText(input.avatarUrl, 'avatarUrl', 2048, issues);
  const phone = typeof phoneValue === 'string' ? phoneValue : undefined;
  const avatarUrl = typeof avatarUrlValue === 'string' ? avatarUrlValue : undefined;
  const status = input.status === undefined ? undefined : parseStatusValue(input.status, 'status', issues);
  const emailVerified = input.emailVerified === undefined ? undefined : input.emailVerified === true;
  const organizationIds = parseUuidArray(input.organizationIds, 'organizationIds', issues);

  return finish(
    {
      email,
      password,
      firstName,
      lastName,
      ...(phone === undefined ? {} : { phone }),
      ...(avatarUrl === undefined ? {} : { avatarUrl }),
      ...(status === undefined ? {} : { status }),
      ...(emailVerified === undefined ? {} : { emailVerified }),
      ...(organizationIds === undefined ? {} : { organizationIds }),
    },
    issues,
  );
};

export const parseUpdateUser = (input: unknown): UpdateUserInput => parseProfileUpdate(input);
export const parseProfileUpdate = (input: unknown): UpdateProfileInput => {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) {
    throw validationError([{ field: 'body', issue: 'must be an object' }]);
  }
  const firstName = optionalNonNullText(input.firstName, 'firstName', 100, issues);
  const lastName = optionalNonNullText(input.lastName, 'lastName', 100, issues);
  const phone = optionalText(input.phone, 'phone', 32, issues);
  const avatarUrl = optionalText(input.avatarUrl, 'avatarUrl', 2048, issues);
  if (firstName === undefined && lastName === undefined && phone === undefined && avatarUrl === undefined) {
    issues.push({ field: 'body', issue: 'must contain at least one editable field' });
  }
  return finish(
    {
      ...(firstName === undefined ? {} : { firstName }),
      ...(lastName === undefined ? {} : { lastName }),
      ...(phone === undefined ? {} : { phone }),
      ...(avatarUrl === undefined ? {} : { avatarUrl }),
    },
    issues,
  );
};

export const parseStatusUpdate = (input: unknown): UpdateUserStatusInput => {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) {
    throw validationError([{ field: 'body', issue: 'must be an object' }]);
  }
  const status = parseStatusValue(input.status, 'status', issues);
  return finish({ status }, issues);
};

export const parseListQuery = (query: Record<string, string | undefined>): UserListQuery => {
  const issues: ValidationIssue[] = [];
  const page = parsePositiveInteger(query.page, 'page', 1, issues);
  const pageSize = parsePositiveInteger(query.pageSize ?? query.limit, 'pageSize', 25, issues);
  if (pageSize > 100) {
    issues.push({ field: 'pageSize', issue: 'must be at most 100' });
  }
  const status = query.status === undefined ? undefined : parseStatusValue(query.status, 'status', issues);
  const organizationId = query.organizationId === undefined
    ? undefined
    : validateUuid(query.organizationId, 'organizationId', issues);
  const search = query.search?.trim();
  if (search !== undefined && search.length > 100) {
    issues.push({ field: 'search', issue: 'must be at most 100 characters' });
  }
  return finish(
    {
      page,
      pageSize,
      ...(search === undefined || search.length === 0 ? {} : { search }),
      ...(status === undefined ? {} : { status }),
      ...(organizationId === undefined ? {} : { organizationId }),
    },
    issues,
  );
};

export const parseMembership = (input: unknown): AddMembershipInput => {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) {
    throw validationError([{ field: 'body', issue: 'must be an object' }]);
  }
  const organizationId = validateUuid(input.organizationId, 'organizationId', issues);
  const role = input.role === undefined ? 'member' : requiredText(input.role, 'role', 100, issues);
  const status = input.status === undefined ? 'active' : parseMembershipStatus(input.status, issues);
  return finish({ organizationId, role, status }, issues);
};

export const parseUserId = (value: unknown, field = 'userId'): UUID => {
  const issues: ValidationIssue[] = [];
  const id = validateUuid(value, field, issues);
  return finish(id, issues);
};

const parsePositiveInteger = (
  raw: string | undefined,
  field: string,
  fallback: number,
  issues: ValidationIssue[],
): number => {
  if (raw === undefined || raw.length === 0) {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    issues.push({ field, issue: 'must be a positive integer' });
    return fallback;
  }
  return value;
};

const parseStatusValue = (value: unknown, field: string, issues: ValidationIssue[]): UserStatus => {
  if (typeof value === 'string' && USER_STATUSES.includes(value as UserStatus)) {
    return value as UserStatus;
  }
  issues.push({ field, issue: `must be one of: ${USER_STATUSES.join(', ')}` });
  return 'active';
};

const parseMembershipStatus = (value: unknown, issues: ValidationIssue[]): MembershipStatus => {
  if (typeof value === 'string' && MEMBERSHIP_STATUSES.includes(value as MembershipStatus)) {
    return value as MembershipStatus;
  }
  issues.push({ field: 'status', issue: `must be one of: ${MEMBERSHIP_STATUSES.join(', ')}` });
  return 'active';
};

const parseUuidArray = (
  value: unknown,
  field: string,
  issues: ValidationIssue[],
): UUID[] | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value) || value.length > 50) {
    issues.push({ field, issue: 'must be an array containing at most 50 UUIDs' });
    return [];
  }
  return value.map((entry, index) => validateUuid(entry, `${field}[${index}]`, issues));
};
