// AXIVON ONE Backend Application Core
import { APP_CONFIG } from '@axivon/config';
import { AuthenticationBackendService } from '../../../../modules/core/authentication/backend/index.js';

export const createApp = () => {
  return {
    name: APP_CONFIG.organization,
    phase: APP_CONFIG.phase,
    initialized: true,
    modules: {
      authentication: AuthenticationBackendService,
    },
  };
};
