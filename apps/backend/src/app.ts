// AXIVON ONE Backend Application Core
import { APP_CONFIG } from '@axivon/config';

export const createApp = () => {
  return {
    name: APP_CONFIG.organization,
    phase: APP_CONFIG.phase,
    initialized: true,
  };
};
