import { randomUUID } from 'node:crypto';
import {
  forbidden,
  userNotFound,
} from '../contracts/errors.js';
import type {
  AddMembershipInput,
  AuthenticatedActor,
  CreateUserInput,
  ISODateString,
  UpdateProfileInput,
  UpdateUserInput,
  UpdateUserStatusInput,
  UserListQuery,
  UserListResult,
  UserMembership,
  UserProfile,
  UserStatus,
  UUID,
} from '../contracts/index.js';
import type { UserRepository } from '../repositories/index.js';
import { withoutPassword } from '../repositories/index.js';
import type { PasswordHasher } from '../../../authentication/backend/utils/password.hasher.js';
import type { UserAuthorization } from '../contracts/index.js';

export interface UserManagementClock {
  now(): Date;
}

export const systemClock = (): UserManagementClock => ({ now: () => new Date() });

export interface UserManagementServiceDependencies {
  repository: UserRepository;
  passwordHasher: PasswordHasher;
  authorization: UserAuthorization;
  clock?: UserManagementClock;
}

export interface UserManagementService {
  createUser(actor: AuthenticatedActor, input: CreateUserInput): Promise<UserProfile>;
  listUsers(actor: AuthenticatedActor, query: UserListQuery): Promise<UserListResult>;
  getUser(actor: AuthenticatedActor, userId: UUID): Promise<UserProfile>;
  updateUser(actor: AuthenticatedActor, userId: UUID, input: UpdateUserInput): Promise<UserProfile>;
  updateProfile(actor: AuthenticatedActor, userId: UUID, input: UpdateProfileInput): Promise<UserProfile>;
  updateStatus(actor: AuthenticatedActor, userId: UUID, input: UpdateUserStatusInput): Promise<UserProfile>;
  listMemberships(actor: AuthenticatedActor, userId: UUID): Promise<UserMembership[]>;
  addMembership(actor: AuthenticatedActor, userId: UUID, input: AddMembershipInput): Promise<UserMembership>;
  removeMembership(actor: AuthenticatedActor, userId: UUID, organizationId: UUID): Promise<void>;
}

export const createUserManagementService = (
  dependencies: UserManagementServiceDependencies,
): UserManagementService => {
  const clock = dependencies.clock ?? systemClock();

  const assertAllowed = async (
    actor: AuthenticatedActor,
    action: Parameters<UserAuthorization['can']>[1],
    targetUserId?: UUID,
  ): Promise<void> => {
    if (!(await dependencies.authorization.can(actor, action, targetUserId))) {
      throw forbidden();
    }
  };

  const findRequired = async (userId: UUID): Promise<NonNullable<Awaited<ReturnType<UserRepository['findById']>>>> => {
    const record = await dependencies.repository.findById(userId);
    if (record === null) {
      throw userNotFound();
    }
    return record;
  };

  const now = (): ISODateString => clock.now().toISOString();

  return {
    createUser: async (actor, input): Promise<UserProfile> => {
      await assertAllowed(actor, 'user:create');
      const created = await dependencies.repository.create({
        email: input.email.trim().toLowerCase(),
        passwordHash: await dependencies.passwordHasher.hash(input.password),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone?.trim() ?? null,
        avatarUrl: input.avatarUrl?.trim() ?? null,
        status: input.status ?? 'pending',
        emailVerified: input.emailVerified ?? false,
        now: now(),
        organizationIds: input.organizationIds ?? [],
      });
      return withoutPassword(created);
    },

    listUsers: async (actor, query): Promise<UserListResult> => {
      await assertAllowed(actor, 'user:list');
      return dependencies.repository.list(query);
    },

    getUser: async (actor, userId): Promise<UserProfile> => {
      await assertAllowed(actor, 'user:read', userId);
      return withoutPassword(await findRequired(userId));
    },

    updateUser: async (actor, userId, input): Promise<UserProfile> => {
      await assertAllowed(actor, 'user:update', userId);
      const updated = await dependencies.repository.update(userId, input, now());
      if (updated === null) {
        throw userNotFound();
      }
      return withoutPassword(updated);
    },

    updateProfile: async (actor, userId, input): Promise<UserProfile> => {
      await assertAllowed(actor, 'user:update', userId);
      const updated = await dependencies.repository.update(userId, input, now());
      if (updated === null) {
        throw userNotFound();
      }
      return withoutPassword(updated);
    },

    updateStatus: async (actor, userId, input): Promise<UserProfile> => {
      await assertAllowed(actor, 'user:status', userId);
      const updated = await dependencies.repository.updateStatus(userId, input.status as UserStatus, now());
      if (updated === null) {
        throw userNotFound();
      }
      return withoutPassword(updated);
    },

    listMemberships: async (actor, userId): Promise<UserMembership[]> => {
      await assertAllowed(actor, 'user:membership', userId);
      await findRequired(userId);
      return dependencies.repository.listMemberships(userId);
    },

    addMembership: async (actor, userId, input): Promise<UserMembership> => {
      await assertAllowed(actor, 'user:membership', userId);
      await findRequired(userId);
      return dependencies.repository.addMembership(userId, input, now());
    },

    removeMembership: async (actor, userId, organizationId): Promise<void> => {
      await assertAllowed(actor, 'user:membership', userId);
      await findRequired(userId);
      const removed = await dependencies.repository.removeMembership(userId, organizationId, now());
      if (!removed) {
        throw userNotFound();
      }
    },
  };
};

/** Useful for tests and seed scripts that need a stable admin actor. */
export const platformAdminActor = (userId = randomUUID()): AuthenticatedActor => ({
  userId,
  isPlatformAdmin: true,
});
