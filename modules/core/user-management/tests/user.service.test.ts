import { describe, expect, it } from 'vitest';
import { isUserManagementError } from '../backend/contracts/errors.js';
import type { AuthenticatedActor } from '../backend/contracts/index.js';
import { createInMemoryUserRepository } from '../backend/repositories/in-memory.repository.js';
import { createUserAuthorization } from '../backend/services/authorization.js';
import { createUserManagementService, platformAdminActor } from '../backend/services/user.service.js';

const passwordHasher = {
  hash: async (value: string): Promise<string> => `hash:${value}`,
  verify: async (value: string, hash: string): Promise<boolean> => hash === `hash:${value}`,
  dummyVerify: async (): Promise<void> => undefined,
};

const createHarness = () => {
  const repository = createInMemoryUserRepository();
  const service = createUserManagementService({
    repository,
    passwordHasher,
    authorization: createUserAuthorization(),
    clock: { now: () => new Date('2026-09-16T00:00:00.000Z') },
  });
  return { repository, service };
};

const createInput = (email = 'ada@example.test') => ({
  email,
  password: 'StrongPass1!',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: '+1-555-0100',
});

describe('UserManagementService', () => {
  it('creates a user and never returns a password hash', async () => {
    const { service } = createHarness();
    const user = await service.createUser(platformAdminActor(), createInput());

    expect(user.email).toBe('ada@example.test');
    expect(user.status).toBe('pending');
    expect(user.memberships).toEqual([]);
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('normalises email and rejects duplicate addresses', async () => {
    const { service } = createHarness();
    await service.createUser(platformAdminActor(), createInput('Ada@Example.Test'));

    await expect(service.createUser(platformAdminActor(), createInput('ada@example.test'))).rejects.toMatchObject({
      code: 'EMAIL_ALREADY_EXISTS',
    });
  });

  it('lists users with pagination', async () => {
    const { service } = createHarness();
    const admin = platformAdminActor();
    await service.createUser(admin, createInput('one@example.test'));
    await service.createUser(admin, createInput('two@example.test'));

    const result = await service.listUsers(admin, { page: 1, pageSize: 1 });
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.totalPages).toBe(2);
  });

  it('allows a user to read and update their own profile', async () => {
    const { service } = createHarness();
    const created = await service.createUser(platformAdminActor(), createInput());
    const actor: AuthenticatedActor = { userId: created.id };

    const read = await service.getUser(actor, created.id);
    const updated = await service.updateProfile(actor, created.id, { firstName: 'Augusta' });

    expect(read.id).toBe(created.id);
    expect(updated.firstName).toBe('Augusta');
  });

  it('does not allow a normal user to list users or change status', async () => {
    const { service } = createHarness();
    const created = await service.createUser(platformAdminActor(), createInput());
    const actor: AuthenticatedActor = { userId: created.id };

    await expect(service.listUsers(actor, { page: 1, pageSize: 25 })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(service.updateStatus(actor, created.id, { status: 'active' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('allows an administrator to update status and membership', async () => {
    const { service } = createHarness();
    const admin = platformAdminActor();
    const created = await service.createUser(admin, createInput());
    const organizationId = '00000000-0000-4000-8000-000000000001';

    const active = await service.updateStatus(admin, created.id, { status: 'active' });
    const membership = await service.addMembership(admin, created.id, { organizationId, role: 'admin' });
    const memberships = await service.listMemberships(admin, created.id);

    expect(active.status).toBe('active');
    expect(membership.role).toBe('admin');
    expect(memberships).toHaveLength(1);
  });

  it('removes a membership and reports missing users', async () => {
    const { service } = createHarness();
    const admin = platformAdminActor();
    const created = await service.createUser(admin, createInput());
    const organizationId = '00000000-0000-4000-8000-000000000001';

    await service.addMembership(admin, created.id, { organizationId });
    await service.removeMembership(admin, created.id, organizationId);
    expect(await service.listMemberships(admin, created.id)).toEqual([]);

    await expect(service.getUser(admin, '00000000-0000-4000-8000-000000000002')).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
    });
  });

  it('exposes typed user errors', async () => {
    const { service } = createHarness();
    try {
      await service.listUsers({ userId: 'not-admin' }, { page: 1, pageSize: 25 });
    } catch (error) {
      expect(isUserManagementError(error)).toBe(true);
    }
  });
});
