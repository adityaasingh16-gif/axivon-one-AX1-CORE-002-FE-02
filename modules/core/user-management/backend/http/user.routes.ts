import { methodNotAllowed, userNotFound } from '../contracts/errors.js';
import type { HttpHandler, HttpMethod, HttpRequest, HttpResponse } from '../../../authentication/backend/http/types.js';
import { resolveRequestId, securityHeaders } from '../../../authentication/backend/http/middleware.js';
import { createUserErrorResponseFactory, type UserErrorResponseFactory } from './user-error.handler.js';
import type { UserController } from './user.controller.js';

interface RouteEntry {
  method: HttpMethod;
  pattern: readonly string[];
  operationId: string;
  handle: (request: HttpRequest, params: Record<string, string>) => Promise<HttpResponse>;
}

export interface UserRouter {
  handle: HttpHandler;
  routes(): readonly { method: HttpMethod; path: string; operationId: string }[];
}

export interface UserRouterOptions {
  controller: UserController;
  errorResponses?: UserErrorResponseFactory;
}

const patterns = {
  collection: ['/api/v1/users'],
  detail: ['/api/v1/users', ':id'],
  profile: ['/api/v1/users', ':id', 'profile'],
  status: ['/api/v1/users', ':id', 'status'],
  memberships: ['/api/v1/users', ':id', 'memberships'],
  membershipDetail: ['/api/v1/users', ':id', 'memberships', ':organizationId'],
} as const;

const pathFor = (pattern: readonly string[]): string => pattern.join('/');

const splitPath = (path: string): string[] => {
  const pathname = new URL(path, 'http://axivon.internal').pathname.replace(/\/$/, '');
  return pathname.split('/').filter((segment) => segment.length > 0);
};

const match = (
  pattern: readonly string[],
  path: string,
): { matched: boolean; params: Record<string, string> } => {
  const expected = pattern.flatMap((segment) => segment.split('/')).filter(Boolean);
  const actual = splitPath(path);
  if (expected.length !== actual.length) {
    return { matched: false, params: {} };
  }
  const params: Record<string, string> = {};
  for (let index = 0; index < expected.length; index += 1) {
    const expectedSegment = expected[index];
    const actualSegment = actual[index];
    if (expectedSegment === undefined || actualSegment === undefined) {
      return { matched: false, params: {} };
    }
    if (expectedSegment.startsWith(':')) {
      params[expectedSegment.slice(1)] = decodeURIComponent(actualSegment);
    } else if (expectedSegment !== actualSegment) {
      return { matched: false, params: {} };
    }
  }
  return { matched: true, params };
};

export const createUserRouter = (options: UserRouterOptions): UserRouter => {
  const errors = options.errorResponses ?? createUserErrorResponseFactory();
  const controller = options.controller;
  const entries: RouteEntry[] = [
    { method: 'POST', pattern: patterns.collection, operationId: 'users.create', handle: controller.create },
    { method: 'GET', pattern: patterns.collection, operationId: 'users.list', handle: controller.list },
    {
      method: 'GET',
      pattern: patterns.detail,
      operationId: 'users.detail',
      handle: (request, params) => controller.detail(request, params['id'] ?? ''),
    },
    {
      method: 'PATCH',
      pattern: patterns.detail,
      operationId: 'users.update',
      handle: (request, params) => controller.update(request, params['id'] ?? ''),
    },
    {
      method: 'PATCH',
      pattern: patterns.profile,
      operationId: 'users.profile',
      handle: (request, params) => controller.profile(request, params['id'] ?? ''),
    },
    {
      method: 'POST',
      pattern: patterns.status,
      operationId: 'users.status',
      handle: (request, params) => controller.status(request, params['id'] ?? ''),
    },
    {
      method: 'GET',
      pattern: patterns.memberships,
      operationId: 'users.memberships.list',
      handle: (request, params) => controller.memberships(request, params['id'] ?? ''),
    },
    {
      method: 'POST',
      pattern: patterns.memberships,
      operationId: 'users.memberships.add',
      handle: (request, params) => controller.addMembership(request, params['id'] ?? ''),
    },
    {
      method: 'DELETE',
      pattern: patterns.membershipDetail,
      operationId: 'users.memberships.remove',
      handle: (request, params) =>
        controller.removeMembership(request, params['id'] ?? '', params['organizationId'] ?? ''),
    },
  ];

  const routeDescriptors = entries.map((entry) => ({
    method: entry.method,
    path: pathFor(entry.pattern),
    operationId: entry.operationId,
  }));

  return {
    routes: () => routeDescriptors,
    handle: async (request: HttpRequest): Promise<HttpResponse> => {
      const requestId = resolveRequestId(request);
      const matching = entries.filter((entry) => match(entry.pattern, request.path).matched);
      if (matching.length === 0) {
        return render(errors.fromError(userNotFound(), requestId), requestId);
      }
      const selected = matching.find((entry) => entry.method === request.method);
      if (selected === undefined) {
        const response = errors.fromError(methodNotAllowed(), requestId);
        return render(response, requestId, {
          Allow: matching.map((entry) => entry.method).join(', '),
        });
      }
      const matched = match(selected.pattern, request.path);
      try {
        return render(await selected.handle(request, matched.params), requestId);
      } catch (error) {
        return render(errors.fromError(error, requestId), requestId);
      }
    },
  };
};

const render = (
  response: HttpResponse,
  requestId: string,
  extraHeaders: Record<string, string> = {},
): HttpResponse => ({
  ...response,
  headers: {
    ...securityHeaders(),
    ...response.headers,
    ...extraHeaders,
    'X-Request-Id': requestId,
  },
});
