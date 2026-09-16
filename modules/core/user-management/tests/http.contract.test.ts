import { describe, expect, it } from 'vitest';
import { unauthorized } from '../../authentication/backend/contracts/errors.js';
import type { AuthGuard } from '../../authentication/backend/http/middleware.js';
import { createUserController } from '../backend/http/user.controller.js';
import { createUserRouter } from '../backend/http/user.routes.js';
import { createInMemoryUserRepository } from '../backend/repositories/in-memory.repository.js';
import { createUserAuthorization } from '../backend/services/authorization.js';
import { createUserManagementService } from '../backend/services/user.service.js';

const adminId = '00000000-0000-4000-8000-000000000001';
const passwordHasher = {
  hash: async (value: string): Promise<string> => `hash:${value}`,
  verify: async (value: string, hash: string): Promise<boolean> => hash === `hash:${value}`,
  dummyVerify: async (): Promise<void> => undefined,
};

const authGuard: AuthGuard = {
  authenticate: async (request) => {
    if (request.headers.authorization !== 'Bearer test-admin') {
      return { authenticated: false, error: unauthorized() };
    }
    return {
      authenticated: true,
      token: 'test-admin',
      session: {
        userId: adminId,
        sessionId: '00000000-0000-4000-8000-000000000002',
        user: {
          id: adminId,
          email: 'admin@example.test',
          firstName: 'Admin',
          lastName: 'User',
          status: 'active',
          emailVerified: true,
        },
      },
    };
  },
};

const createRouter = () => {
  const service = createUserManagementService({
    repository: createInMemoryUserRepository(),
    passwordHasher,
    authorization: createUserAuthorization({ adminUserIds: new Set([adminId]) }),
  });
  const controller = createUserController({ service, authGuard });
  return createUserRouter({ controller });
};

const request = (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown) => ({
  method,
  path,
  headers: { authorization: 'Bearer test-admin' },
  body,
  requestId: 'req_user_test_01',
});

describe('User Management HTTP contract', () => {
  it('registers the collection routes', () => {
    const router = createRouter();
    const routes = router.routes();
    expect(routes).toEqual(expect.arrayContaining([
      expect.objectContaining({ method: 'POST', path: '/api/v1/users', operationId: 'users.create' }),
      expect.objectContaining({ method: 'GET', path: '/api/v1/users', operationId: 'users.list' }),
      expect.objectContaining({ method: 'PATCH', path: '/api/v1/users/:id/profile', operationId: 'users.profile' }),
    ]));
  });

  it('creates and lists users through the router', async () => {
    const router = createRouter();
    const createResponse = await router.handle(request('POST', '/api/v1/users', {
      email: 'ada@example.test',
      password: 'StrongPass1!',
      firstName: 'Ada',
      lastName: 'Lovelace',
    }));
    expect(createResponse.status).toBe(201);

    const listResponse = await router.handle(request('GET', '/api/v1/users?page=1&pageSize=10'));
    expect(listResponse.status).toBe(200);
    expect((listResponse.body as { success: boolean }).success).toBe(true);
  });

  it('rejects malformed create requests with 422', async () => {
    const router = createRouter();
    const response = await router.handle(request('POST', '/api/v1/users', {
      email: 'not-an-email',
      password: 'short',
    }));
    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('rejects requests without an access token', async () => {
    const router = createRouter();
    const response = await router.handle({
      ...request('GET', '/api/v1/users'),
      headers: {},
    });
    expect(response.status).toBe(401);
  });

  it('supports update, status and membership routes', async () => {
    const router = createRouter();
    const createResponse = await router.handle(request('POST', '/api/v1/users', {
      email: 'grace@example.test',
      password: 'StrongPass1!',
      firstName: 'Grace',
      lastName: 'Hopper',
    }));
    const created = (createResponse.body as { data: { id: string } }).data;
    const update = await router.handle(request('PATCH', `/api/v1/users/${created.id}`, { firstName: 'Rear Admiral' }));
    const status = await router.handle(request('POST', `/api/v1/users/${created.id}/status`, { status: 'active' }));
    const membership = await router.handle(request('POST', `/api/v1/users/${created.id}/memberships`, {
      organizationId: '00000000-0000-4000-8000-000000000003',
    }));

    expect(update.status).toBe(200);
    expect(status.status).toBe(200);
    expect(membership.status).toBe(201);
  });
});

