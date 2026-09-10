// Frontend Application Entry Point
import {
  AuthService,
  authStore,
  requireAuth,
} from '../../../../modules/core/authentication/frontend/index.js';

export const initFrontendApp = (): void => {
  console.log('AXIVON ONE Frontend Initialized');
};

export {
  AuthService,
  authStore,
  requireAuth,
};
