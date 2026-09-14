import type { UserProfileRecord, UserListQuery } from '../types.js';
import { filterUsers, paginateUsers } from '../user-management.js';

export interface UserListState {
  items: UserProfileRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export const buildUserListState = (users: readonly UserProfileRecord[], query: UserListQuery): UserListState => {
  const filtered = filterUsers(users, query);
  return {
    items: paginateUsers(filtered, query.page, query.pageSize),
    total: filtered.length,
    page: Math.max(1, query.page),
    pageSize: Math.max(1, query.pageSize),
  };
};
