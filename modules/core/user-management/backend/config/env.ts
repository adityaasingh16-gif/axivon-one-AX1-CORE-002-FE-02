import type { UserManagementConfig, UUID } from '../contracts/index.js';

export interface UserManagementEnvOptions {
  databaseUrl?: string;
  adminUserIds?: ReadonlySet<UUID>;
  defaultPageSize?: number;
  maxPageSize?: number;
}

const parseIds = (raw: string | undefined): ReadonlySet<UUID> => {
  const values = (raw ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return new Set(values);
};

export const resolveUserManagementConfig = (
  options: UserManagementEnvOptions = {},
): UserManagementConfig & { databaseUrl?: string } => ({
  databaseUrl: options.databaseUrl ?? process.env['DATABASE_URL'],
  adminUserIds: options.adminUserIds ?? parseIds(process.env['USER_MANAGEMENT_ADMIN_USER_IDS']),
  defaultPageSize: options.defaultPageSize ?? 25,
  maxPageSize: options.maxPageSize ?? 100,
});
