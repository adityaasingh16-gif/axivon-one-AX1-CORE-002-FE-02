import type { UserStatus } from '@axivon/types';
import type { UserListQuery, UserProfileRecord } from './types.js';

export const filterUsers = (users: readonly UserProfileRecord[], query: UserListQuery): UserProfileRecord[] => {
  const search = query.search?.trim().toLocaleLowerCase() ?? '';
  return users.filter((user) => {
    const matchesSearch = !search ||
      `${user.firstName} ${user.lastName} ${user.email}`.toLocaleLowerCase().includes(search);
    const matchesStatus = !query.status || user.status === query.status;
    return matchesSearch && matchesStatus;
  });
};

export const paginateUsers = (users: readonly UserProfileRecord[], page: number, pageSize: number): UserProfileRecord[] => {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safePageSize;
  return users.slice(start, start + safePageSize);
};

export const getNextStatus = (status: UserStatus): UserStatus => {
  if (status === 'active') return 'inactive';
  if (status === 'inactive') return 'suspended';
  if (status === 'suspended') return 'active';
  return 'active';
};
