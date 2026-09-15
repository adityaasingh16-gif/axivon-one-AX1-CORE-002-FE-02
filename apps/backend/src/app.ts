// AXIVON ONE Backend Application Core
//
// The application composition root wires the CORE-001 authentication module
// into the backend app. The module itself remains framework-agnostic; an HTTP
// adapter is provided by `server.ts` for local development.

import { APP_CONFIG } from '../../../packages/config/src/index.js';
import {
  createAuthenticationModule,
  type AuthenticationModule,
} from '../../../modules/core/authentication/backend/index.js';

export interface BackendApp {
  name: string;
  phase: string;
  initialized: boolean;
  modules: {
    authentication: AuthenticationModule;
  };
}

export const createApp = (): BackendApp => {
  const authentication = createAuthenticationModule();

  return {
    name: APP_CONFIG.organization,
    phase: APP_CONFIG.phase,
    initialized: true,
    modules: {
      authentication,
    },
  };
};
