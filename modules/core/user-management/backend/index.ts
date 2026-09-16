/**
 * AXIVON ONE — User Management Module (CORE-002)
 * Public backend surface.
 */

export { MODULE_ID, MODULE_NAME } from '../shared/index.js';
export * from './contracts/index.js';
export * from './contracts/errors.js';
export { resolveUserManagementConfig, type UserManagementEnvOptions } from './config/env.js';
export { createPostgresPool, type PostgresPoolOptions } from './database/pool.js';
export { createUserManagementModule, type CreateUserManagementModuleOptions, type UserManagementModule } from './factory.js';
export { createUserController, type CreateUserControllerOptions, type UserController } from './http/user.controller.js';
export { createUserErrorResponseFactory, type UserErrorResponseFactory } from './http/user-error.handler.js';
export { createUserRouter, type UserRouter, type UserRouterOptions } from './http/user.routes.js';
export type {
  CreateUserRecord,
  UserRecord,
  UserRepository,
} from './repositories/index.js';
export { createInMemoryUserRepository } from './repositories/in-memory.repository.js';
export { createPostgresUserRepository } from './repositories/postgres.repository.js';
export { createUserAuthorization, type UserAuthorizationOptions } from './services/authorization.js';
export {
  createUserManagementService,
  platformAdminActor,
  systemClock,
  type UserManagementClock,
  type UserManagementService,
  type UserManagementServiceDependencies,
} from './services/user.service.js';
export {
  parseCreateUser,
  parseListQuery,
  parseMembership,
  parseProfileUpdate,
  parseStatusUpdate,
  parseUpdateUser,
  parseUserId,
} from './validators/user.validators.js';
