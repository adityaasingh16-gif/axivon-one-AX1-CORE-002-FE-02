import { describe, expect, it, vi } from 'vitest';
import { NotificationsController } from '../notifications.js';
import { hasPreferenceErrors, validateNotificationId, validatePreferences } from '../validation.js';
import type { NotificationPreferences, NotificationsApi } from '../types.js';

const preferences: NotificationPreferences = { inApp: true, email: false, push: true, categories: { system: true } };
const notification = { id: 'n-1', title: 'Welcome', message: 'Hello', kind: 'info' as const, createdAt: '2026-09-19T10:00:00Z', read: false };

const api = (): NotificationsApi => ({
  list: vi.fn().mockResolvedValue({ items: [notification], page: 1, pageSize: 20, total: 1, unreadCount: 1, hasNextPage: false }),
  get: vi.fn().mockResolvedValue(notification),
  markRead: vi.fn().mockResolvedValue({ ...notification, read: true }),
  markUnread: vi.fn().mockResolvedValue(notification),
  getPreferences: vi.fn().mockResolvedValue(preferences),
  updatePreferences: vi.fn().mockResolvedValue(preferences),
});

describe('notification validation', () => {
  it('rejects blank ids', () => expect(validateNotificationId('   ')).toBeDefined());
  it('accepts a valid id', () => expect(validateNotificationId('n-1')).toBeUndefined());
  it('validates preference shape', () => expect(hasPreferenceErrors(validatePreferences(preferences))).toBe(false));
});

describe('NotificationsController', () => {
  it('loads notifications and exposes success state', async () => {
    const controller = new NotificationsController(api());
    await controller.load();
    expect(controller.getState().status).toBe('success');
    expect(controller.getState().page?.unreadCount).toBe(1);
  });

  it('updates read state without waiting for a reload', async () => {
    const controller = new NotificationsController(api());
    await controller.load();
    await controller.setRead('n-1', true);
    expect(controller.getState().page?.items[0]?.read).toBe(true);
    expect(controller.getState().page?.unreadCount).toBe(0);
  });

  it('handles API failures as an error state', async () => {
    const failingApi = api();
    failingApi.list = vi.fn().mockRejectedValue(new Error('Network unavailable'));
    const controller = new NotificationsController(failingApi);
    await controller.load();
    expect(controller.getState().status).toBe('error');
    expect(controller.getState().errorMessage).toBe('Network unavailable');
  });

  it('rejects invalid preference saves before calling the API', async () => {
    const service = api();
    const controller = new NotificationsController(service);
    const invalid = { ...preferences, categories: { system: 'yes' } } as unknown as NotificationPreferences;
    expect(await controller.savePreferences(invalid)).toBe(false);
    expect(service.updatePreferences).not.toHaveBeenCalled();
  });
});
