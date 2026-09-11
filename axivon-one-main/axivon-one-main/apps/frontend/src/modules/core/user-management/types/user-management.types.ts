import type { UserProfile, UserStatus } from '@axivon/types';

export type MembershipStatus = 'active' | 'invited' | 'suspended';

export interface UserMembership {
  id: string;
  organizationId: string;
  organizationName: string;
  role: string;
  status: MembershipStatus;
  joinedAt?: string;
}

export interface ManagedUser extends UserProfile {
  memberships: UserMembership[];
}

export interface UserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: UserStatus;
  organizationName: string;
  role: string;
  membershipStatus: MembershipStatus;
}

export interface UserManagementState {
  users: ManagedUser[];
  selectedUserId: string | null;
  search: string;
  statusFilter: UserStatus | 'all';
  view: 'list' | 'detail' | 'create' | 'edit';
  isLoading: boolean;
  error: string | null;
}
