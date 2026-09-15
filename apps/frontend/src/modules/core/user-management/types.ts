import type { UserProfile, UserStatus, UUID } from '@axivon/types';

export type MembershipStatus = 'member' | 'invited' | 'suspended' | 'removed';

export interface UserMembership {
  id: UUID;
  organizationId: UUID;
  organizationName: string;
  role: string;
  status: MembershipStatus;
}

export interface UserProfileRecord extends UserProfile {
  memberships: UserMembership[];
}

export interface UserProfileDraft {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: UserStatus;
  organizationId: UUID;
}

export interface UserListQuery {
  search?: string;
  status?: UserStatus;
  page: number;
  pageSize: number;
}
