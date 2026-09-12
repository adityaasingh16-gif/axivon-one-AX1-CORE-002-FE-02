import type { UUID } from '@axivon/types';
import { filterUsers, getNextStatus, paginateUsers } from '../user-management.js';
import { validateUserProfile } from '../validation.js';
import { getFieldDescribedBy, getStatusAnnouncement, getTableLabel } from '../accessibility.js';
import type { UserProfileRecord } from '../types.js';

const id = '00000000-0000-4000-8000-000000000001' as UUID;
const users: UserProfileRecord[] = [
  { id, createdAt: '', updatedAt: '', email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace', status: 'active', organizationId: id, memberships: [] },
  { id: '00000000-0000-4000-8000-000000000002' as UUID, createdAt: '', updatedAt: '', email: 'grace@example.com', firstName: 'Grace', lastName: 'Hopper', status: 'inactive', organizationId: id, memberships: [] },
];

const assert = (condition: boolean, message: string): void => { if (!condition) throw new Error(message); };

export const runUserManagementTests = (): void => {
  assert(filterUsers(users, { search: 'ada', page: 1, pageSize: 10 }).length === 1, 'search filters users');
  assert(filterUsers(users, { status: 'inactive', page: 1, pageSize: 10 }).length === 1, 'status filters users');
  assert(paginateUsers(users, 2, 1)[0]?.firstName === 'Grace', 'pagination selects page');
  assert(getNextStatus('active') === 'inactive', 'status transition works');
  assert(validateUserProfile({ email: 'bad', firstName: '', lastName: '', status: 'active', organizationId: '' as UUID }).email !== undefined, 'email validation works');
  assert(validateUserProfile({ email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace', status: 'active', organizationId: id }).email === undefined, 'valid profile passes');
  assert(getFieldDescribedBy('email', true) === 'email-error', 'error description id is deterministic');
  assert(getStatusAnnouncement(' Saved ').trim() === 'Saved', 'announcement is normalized');
  assert(getTableLabel('Users', 2) === 'Users list, 2 items', 'table label is accessible');
};
