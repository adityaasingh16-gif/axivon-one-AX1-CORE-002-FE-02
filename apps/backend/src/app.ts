// AXIVON ONE Backend Application Core
//
// The application composition root wires authentication, user management and
// the BUS-007 employee-management workflow.

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
import { createEmployeeModule, type EmployeeModule } from '../../../modules/business/bus-007/backend/index.js';

export interface BackendApp {
  name: string;
  phase: string;
  initialized: boolean;
  modules: {
    authentication: AuthenticationModule;
    userManagement: UserManagementModule;
    employeeManagement: EmployeeModule;
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
  const employeeManagement = createEmployeeModule(authentication.authGuard);

  return {
    name: APP_CONFIG.organization,
    phase: APP_CONFIG.phase,
    initialized: true,
    modules: { authentication, userManagement, employeeManagement },
  };
};
