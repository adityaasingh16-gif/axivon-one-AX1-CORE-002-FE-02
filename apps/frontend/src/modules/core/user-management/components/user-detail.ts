import type { UserProfileRecord } from '../types.js';

export interface UserDetailViewModel {
  fullName: string;
  email: string;
  phone: string;
  status: UserProfileRecord['status'];
  memberships: UserProfileRecord['memberships'];
}

export const toUserDetailViewModel = (user: UserProfileRecord): UserDetailViewModel => ({
  fullName: `${user.firstName} ${user.lastName}`.trim(),
  email: user.email,
  phone: user.phone ?? 'Not provided',
  status: user.status,
  memberships: user.memberships,
});
