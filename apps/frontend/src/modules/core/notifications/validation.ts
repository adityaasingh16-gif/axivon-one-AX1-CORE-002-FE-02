import type { NotificationPreferences } from './types.js';

export interface NotificationPreferenceErrors {
  inApp?: string;
  email?: string;
  push?: string;
  categories?: string;
}

export const validateNotificationId = (id: string): string | undefined =>
  id.trim() ? undefined : 'Notification id is required.';

export const validatePreferences = (
  value: NotificationPreferences,
): NotificationPreferenceErrors => {
  const errors: NotificationPreferenceErrors = {};
  if (typeof value.inApp !== 'boolean') errors.inApp = 'In-app preference must be enabled or disabled.';
  if (typeof value.email !== 'boolean') errors.email = 'Email preference must be enabled or disabled.';
  if (typeof value.push !== 'boolean') errors.push = 'Push preference must be enabled or disabled.';
  if (!value.categories || typeof value.categories !== 'object') {
    errors.categories = 'Notification categories are required.';
  } else if (Object.values(value.categories).some((enabled) => typeof enabled !== 'boolean')) {
    errors.categories = 'Notification categories must contain boolean values.';
  }
  return errors;
};

export const hasPreferenceErrors = (errors: NotificationPreferenceErrors): boolean =>
  Object.keys(errors).length > 0;
