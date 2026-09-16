import type { Pool } from 'pg';
import type { AuthGuard } from '../../authentication/backend/http/middleware.js';
import { createScryptPasswordHasher, type PasswordHasher } from '../../authentication/backend/utils/password.hasher.js';
import { resolveUserManagementConfig, type UserManagementEnvOptions } from './config/env.js';
import type { UserAuthorization } from './contracts/index.js';
import { createUserController, type UserController } from './http/user.controller.js';
import { createUserRouter, type UserRouter } from './http/user.routes.js';
import { createInMemoryUserRepository } from './repositories/in-memory.repository.js';
import { createPostgresUserRepository } from './repositories/postgres.repository.js';
import { createPostgresPool } from './database/pool.js';
import type { UserRepository } from './repositories/index.js';
import { createUserAuthorization } from './services/authorization.js';
import { createUserManagementService, type UserManagementClock, type UserManagementService } from './services/user.service.js';
import type { UserManagementConfig } from './contracts/index.js';

export interface CreateUserManagementModuleOptions extends UserManagementEnvOptions {
  authGuard: AuthGuard;
  repository?: UserRepository;
  pool?: Pool;
  passwordHasher?: PasswordHasher;
  authorization?: UserAuthorization;
  clock?: UserManagementClock;
}

export interface UserManagementModule {
  config: UserManagementConfig;
  service: UserManagementService;
  controller: UserController;
  router: UserRouter;
  repository: UserRepository;
  pool?: Pool;
}

export const createUserManagementModule = (
  options: CreateUserManagementModuleOptions,
): UserManagementModule => {
  const resolved = resolveUserManagementConfig(options);
  const pool = options.pool ?? (resolved.databaseUrl === undefined
    ? undefined
    : createPostgresPool({ connectionString: resolved.databaseUrl }));
  const repository = options.repository ?? (pool === undefined
    ? createInMemoryUserRepository()
    : createPostgresUserRepository(pool));
  const authorization = options.authorization ?? createUserAuthorization({ adminUserIds: resolved.adminUserIds });
  const passwordHasher = options.passwordHasher ?? createScryptPasswordHasher();
  const service = createUserManagementService({
    repository,
    passwordHasher,
    authorization,
    clock: options.clock,
  });
  const controller = createUserController({
    service,
    authGuard: options.authGuard,
    clock: options.clock?.now,
  });
  const router = createUserRouter({ controller });

  return { config: resolved, service, controller, router, repository, pool };
};
