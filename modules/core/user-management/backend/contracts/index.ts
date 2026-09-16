/**
 * AXIVON ONE — User Management Module (CORE-002)
 * Public contracts for user profiles, administration and memberships.
 *
 * User Management depends on Authentication for the authenticated actor. It
 * never accepts an organization or actor identity from a request body.
 */

export type UUID = string;
export type ISODateString = string;

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type MembershipStatus = 'active' | 'inactive' | 'invited' | 'suspended';

export interface UserMembership {
  id: UUID;
  userId: UUID;
  organizationId: UUID;
  role: string;
  status: MembershipStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface UserProfile {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  memberships: UserMembership[];
}

export interface UserListQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: UserStatus;
  organizationId?: UUID;
}

export interface UserListResult {
  items: UserProfile[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  status?: UserStatus;
  emailVerified?: boolean;
  organizationIds?: UUID[];
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateUserStatusInput {
  status: UserStatus;
}

export interface AddMembershipInput {
  organizationId: UUID;
  role?: string;
  status?: MembershipStatus;
}

export interface AuthenticatedActor {
  userId: UUID;
  /** Permission keys are supplied by the future RBAC module. */
  permissions?: readonly string[];
  /** Test/platform adapter hook; production callers should use permissions. */
  isPlatformAdmin?: boolean;
}

export type UserAction =
  | 'user:list'
  | 'user:create'
  | 'user:read'
  | 'user:update'
  | 'user:status'
  | 'user:membership';

export interface UserAuthorization {
  can(actor: AuthenticatedActor, action: UserAction, targetUserId?: UUID): boolean | Promise<boolean>;
}

export interface UserManagementConfig {
  defaultPageSize: number;
  maxPageSize: number;
  adminUserIds: ReadonlySet<UUID>;
}

export const USER_ROUTES = {
  COLLECTION: '/api/v1/users',
  DETAIL: '/api/v1/users/:id',
  PROFILE: '/api/v1/users/:id/profile',
  STATUS: '/api/v1/users/:id/status',
  MEMBERSHIPS: '/api/v1/users/:id/memberships',
  MEMBERSHIP_DETAIL: '/api/v1/users/:id/memberships/:organizationId',
} as const;

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: ISODateString;
  meta?: Record<string, unknown>;
}

export interface ValidationIssue {
  field: string;
  issue: string;
}

export interface ApiFailureResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: ValidationIssue[];
    requestId: string;
  };
  timestamp: ISODateString;
}

export type ApiEnvelope<T> = ApiSuccessResponse<T> | ApiFailureResponse;
