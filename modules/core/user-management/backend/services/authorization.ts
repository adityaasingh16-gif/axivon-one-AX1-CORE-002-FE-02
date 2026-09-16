import type {
  AuthenticatedActor,
  UserAction,
  UserAuthorization,
  UUID,
} from '../contracts/index.js';

export interface UserAuthorizationOptions {
  adminUserIds?: ReadonlySet<UUID>;
}

const MANAGEMENT_PERMISSIONS = new Set([
  'user:manage',
  'users:manage',
  'core:user:manage',
]);

const hasManagementPermission = (actor: AuthenticatedActor): boolean =>
  actor.isPlatformAdmin === true ||
  actor.permissions?.some((permission) => MANAGEMENT_PERMISSIONS.has(permission)) === true;

export const createUserAuthorization = (
  options: UserAuthorizationOptions = {},
): UserAuthorization => ({
  can: async (actor, action: UserAction, targetUserId?: UUID): Promise<boolean> => {
    const isAdmin = actor.isPlatformAdmin === true ||
      options.adminUserIds?.has(actor.userId) === true ||
      hasManagementPermission(actor);

    if (action === 'user:list' || action === 'user:create' || action === 'user:status' || action === 'user:membership') {
      return isAdmin;
    }

    if (action === 'user:read' || action === 'user:update') {
      return isAdmin || targetUserId === actor.userId;
    }

    return false;
  },
});
