import type { AuthGuard } from '../../../authentication/backend/http/middleware.js';
import type { HttpRequest, HttpResponse } from '../../../authentication/backend/http/types.js';
import type { UserManagementService } from '../services/user.service.js';
import {
  parseCreateUser,
  parseListQuery,
  parseMembership,
  parseProfileUpdate,
  parseStatusUpdate,
  parseUpdateUser,
  parseUserId,
} from '../validators/user.validators.js';
import { jsonHeaders } from '../../../authentication/backend/http/types.js';
import type { AuthenticatedActor, UserProfile, UserListResult, UserMembership } from '../contracts/index.js';

export interface UserController {
  create(request: HttpRequest): Promise<HttpResponse>;
  list(request: HttpRequest): Promise<HttpResponse>;
  detail(request: HttpRequest, userId: string): Promise<HttpResponse>;
  update(request: HttpRequest, userId: string): Promise<HttpResponse>;
  profile(request: HttpRequest, userId: string): Promise<HttpResponse>;
  status(request: HttpRequest, userId: string): Promise<HttpResponse>;
  memberships(request: HttpRequest, userId: string): Promise<HttpResponse>;
  addMembership(request: HttpRequest, userId: string): Promise<HttpResponse>;
  removeMembership(request: HttpRequest, userId: string, organizationId: string): Promise<HttpResponse>;
}

export interface CreateUserControllerOptions {
  service: UserManagementService;
  authGuard: AuthGuard;
  clock?: () => Date;
}

export const createUserController = (options: CreateUserControllerOptions): UserController => {
  const clock = options.clock ?? (() => new Date());

  const actorFor = async (request: HttpRequest): Promise<AuthenticatedActor> => {
    const result = await options.authGuard.authenticate(request);
    if (!result.authenticated) {
      throw result.error;
    }
    return { userId: result.session.user.id };
  };

  const success = <T>(data: T, status = 200, message?: string): HttpResponse => ({
    status,
    headers: jsonHeaders(),
    body: {
      success: true,
      data,
      ...(message === undefined ? {} : { message }),
      timestamp: clock().toISOString(),
    },
  });

  return {
    create: async (request) => {
      const actor = await actorFor(request);
      const user = await options.service.createUser(actor, parseCreateUser(request.body));
      return success<UserProfile>(user, 201, 'User created.');
    },

    list: async (request) => {
      const actor = await actorFor(request);
      const url = new URL(request.path, 'http://axivon.internal');
      const query: Record<string, string | undefined> = {};
      for (const [key, value] of url.searchParams.entries()) {
        query[key] = value;
      }
      const result = await options.service.listUsers(actor, parseListQuery(query));
      return success<UserListResult>(result);
    },

    detail: async (request, userId) => {
      const actor = await actorFor(request);
      const user = await options.service.getUser(actor, parseUserId(userId));
      return success<UserProfile>(user);
    },

    update: async (request, userId) => {
      const actor = await actorFor(request);
      const user = await options.service.updateUser(actor, parseUserId(userId), parseUpdateUser(request.body));
      return success<UserProfile>(user, 200, 'User updated.');
    },

    profile: async (request, userId) => {
      const actor = await actorFor(request);
      const user = await options.service.updateProfile(actor, parseUserId(userId), parseProfileUpdate(request.body));
      return success<UserProfile>(user, 200, 'Profile updated.');
    },

    status: async (request, userId) => {
      const actor = await actorFor(request);
      const user = await options.service.updateStatus(actor, parseUserId(userId), parseStatusUpdate(request.body));
      return success<UserProfile>(user, 200, 'User status updated.');
    },

    memberships: async (request, userId) => {
      const actor = await actorFor(request);
      const memberships = await options.service.listMemberships(actor, parseUserId(userId));
      return success<UserMembership[]>(memberships);
    },

    addMembership: async (request, userId) => {
      const actor = await actorFor(request);
      const membership = await options.service.addMembership(
        actor,
        parseUserId(userId),
        parseMembership(request.body),
      );
      return success<UserMembership>(membership, 201, 'Membership added.');
    },

    removeMembership: async (request, userId, organizationId) => {
      const actor = await actorFor(request);
      await options.service.removeMembership(
        actor,
        parseUserId(userId),
        parseUserId(organizationId, 'organizationId'),
      );
      return success({ removed: true }, 200, 'Membership removed.');
    },
  };
};
