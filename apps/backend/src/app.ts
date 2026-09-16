// AXIVON ONE Backend Application Core
//
// The application composition root wires the CORE-001 authentication and
// CORE-002 user-management modules. Database-backed adapters are selected when
// DATABASE_URL is present; tests and local work without a database keep using
// the injected in-memory defaults.

import { APP_CONFIG } from '../../../packages/config/src/index.js';
import {
  createAuthenticationModule,
  createPostgresAuthRepositories,
  type AuthenticationModule,
} from '../../../modules/core/authentication/backend/index.js';
import {
  createPostgresPool,
  createUserManagementModule,
  type UserManagementModule,
} from '../../../modules/core/user-management/backend/index.js';

export interface BackendApp {
  name: string;
  phase: string;
  initialized: boolean;
  modules: {
    authentication: AuthenticationModule;
    userManagement: UserManagementModule;
  };
}

export const createApp = (): BackendApp => {
  const databaseUrl = process.env['DATABASE_URL']?.trim();
  const pool = databaseUrl === undefined || databaseUrl.length === 0
    ? undefined
    : createPostgresPool({ connectionString: databaseUrl });

  const authentication = createAuthenticationModule({
    repositories: pool === undefined ? undefined : createPostgresAuthRepositories(pool),
  });
  const userManagement = createUserManagementModule({
    authGuard: authentication.authGuard,
    pool,
    databaseUrl,
  });

  return {
    name: APP_CONFIG.organization,
    phase: APP_CONFIG.phase,
    initialized: true,
    modules: {
      authentication,
      userManagement,
    },
  };
};
