// Frontend Application Entry Point
import {
  AuthService,
  authStore,
  requireAuth,
} from '../../../../modules/core/authentication/frontend/index.js';
import { registerRoute } from '../routes/index.js';
import { leadManagementRoutes } from '../modules/business/bus-003/routes.js';

export const initFrontendApp = (): void => {
  console.log('AXIVON ONE Frontend Initialized');

  for (const route of leadManagementRoutes) {
    registerRoute(route);
  }
};

export {
  AuthService,
  authStore,
  requireAuth,
};
