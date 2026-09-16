import { randomUUID } from 'node:crypto';
import {
  emailAlreadyExists,
  membershipAlreadyExists,
  membershipNotFound,
} from '../contracts/errors.js';
import type {
  AddMembershipInput,
  UserListResult,
  UserMembership,
  UserStatus,
  UUID,
} from '../contracts/index.js';
import type { CreateUserRecord, UserRecord, UserRepository } from './index.js';

const cloneMembership = (membership: UserMembership): UserMembership => ({ ...membership });

const cloneUser = (user: UserRecord): UserRecord => ({
  ...user,
  memberships: user.memberships.map(cloneMembership),
});

const normaliseEmail = (email: string): string => email.trim().toLowerCase();

export const createInMemoryUserRepository = (seed: UserRecord[] = []): UserRepository => {
  const users = new Map<UUID, UserRecord>();

  for (const user of seed) {
    users.set(user.id, cloneUser(user));
  }

  const findByEmail = async (email: string): Promise<UserRecord | null> => {
    const normalised = normaliseEmail(email);
    const found = [...users.values()].find((user) => user.email === normalised);
    return found === undefined ? null : cloneUser(found);
  };

  return {
    findById: async (id) => {
      const found = users.get(id);
      return found === undefined ? null : cloneUser(found);
    },

    findByEmail,

    list: async (query): Promise<UserListResult> => {
      const search = query.search?.trim().toLowerCase();
      const filtered = [...users.values()]
        .filter((user) => query.status === undefined || user.status === query.status)
        .filter(
          (user) =>
            query.organizationId === undefined ||
            user.memberships.some((membership) => membership.organizationId === query.organizationId),
        )
        .filter((user) => {
          if (search === undefined || search.length === 0) {
            return true;
          }
          return `${user.email} ${user.firstName} ${user.lastName}`.toLowerCase().includes(search);
        })
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

      const start = (query.page - 1) * query.pageSize;
      const items = filtered.slice(start, start + query.pageSize).map(cloneUser);

      return {
        items,
        total: filtered.length,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(filtered.length / query.pageSize),
      };
    },

    create: async (input: CreateUserRecord): Promise<UserRecord> => {
      const email = normaliseEmail(input.email);
      if (await findByEmail(email)) {
        throw emailAlreadyExists();
      }

      const id = randomUUID();
      const memberships: UserMembership[] = [];
      for (const organizationId of [...new Set(input.organizationIds)]) {
        memberships.push({
          id: randomUUID(),
          userId: id,
          organizationId,
          role: 'member',
          status: 'active',
          createdAt: input.now,
          updatedAt: input.now,
        });
      }

      const record: UserRecord = {
        id,
        email,
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        avatarUrl: input.avatarUrl,
        status: input.status,
        emailVerified: input.emailVerified,
        createdAt: input.now,
        updatedAt: input.now,
        memberships,
      };
      users.set(id, record);
      return cloneUser(record);
    },

    update: async (id, input, now): Promise<UserRecord | null> => {
      const record = users.get(id);
      if (record === undefined) {
        return null;
      }
      if (input.firstName !== undefined) record.firstName = input.firstName;
      if (input.lastName !== undefined) record.lastName = input.lastName;
      if (input.phone !== undefined) record.phone = input.phone;
      if (input.avatarUrl !== undefined) record.avatarUrl = input.avatarUrl;
      record.updatedAt = now;
      return cloneUser(record);
    },

    updateStatus: async (id, status: UserStatus, now): Promise<UserRecord | null> => {
      const record = users.get(id);
      if (record === undefined) {
        return null;
      }
      record.status = status;
      record.updatedAt = now;
      return cloneUser(record);
    },

    addMembership: async (userId, input: AddMembershipInput, now): Promise<UserMembership> => {
      const record = users.get(userId);
      if (record === undefined) {
        throw membershipNotFound();
      }
      if (record.memberships.some((membership) => membership.organizationId === input.organizationId)) {
        throw membershipAlreadyExists();
      }
      const membership: UserMembership = {
        id: randomUUID(),
        userId,
        organizationId: input.organizationId,
        role: input.role ?? 'member',
        status: input.status ?? 'active',
        createdAt: now,
        updatedAt: now,
      };
      record.memberships.push(membership);
      record.updatedAt = now;
      return cloneMembership(membership);
    },

    removeMembership: async (userId, organizationId, _now): Promise<boolean> => {
      const record = users.get(userId);
      if (record === undefined) {
        return false;
      }
      const index = record.memberships.findIndex((membership) => membership.organizationId === organizationId);
      if (index < 0) {
        return false;
      }
      record.memberships.splice(index, 1);
      record.updatedAt = _now;
      return true;
    },

    listMemberships: async (userId): Promise<UserMembership[]> => {
      const record = users.get(userId);
      return record?.memberships.map(cloneMembership) ?? [];
    },
  };
};
