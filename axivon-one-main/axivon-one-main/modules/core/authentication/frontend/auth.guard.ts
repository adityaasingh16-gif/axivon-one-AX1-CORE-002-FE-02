import { authStore } from './auth.store.js';

export const requireAuth = (onUnauthorized?: () => void): boolean => {
  const { isAuthenticated, isLoading } = authStore.getState();
  if (!isLoading && !isAuthenticated) {
    if (onUnauthorized) {
      onUnauthorized();
    }
    return false;
  }
  return true;
};
