import { describe, expect, it, beforeEach } from 'vitest';
import { dashboardApi } from '../../../../src/services/mockDashboardApi.js';

describe('dashboardApi', () => {
  beforeEach(() => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (key) => store.has(key) ? store.get(key) : null,
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear(),
    };
    localStorage.clear();
    localStorage.setItem('auth_suite_organizations', JSON.stringify([]));
    localStorage.setItem('auth_suite_sessions', JSON.stringify([]));
    localStorage.setItem('auth_suite_settings', JSON.stringify({ networkDelayMs: 0 }));
  });

  it('returns the dashboard contract for a signed-in user', async () => {
    const result = await dashboardApi.getOverview({
      user: { id: 'user_1', name: 'Test User', email: 'test@example.com', isVerified: true, mfaEnabled: true },
    });

    expect(result).toEqual(expect.objectContaining({
      generatedAt: expect.any(String),
      kpis: expect.any(Array),
      activity: expect.any(Array),
      sessions: expect.any(Array),
    }));
    expect(result.kpis.length).toBeGreaterThan(0);
  });

  it('rejects requests without an authenticated user', async () => {
    await expect(dashboardApi.getOverview()).rejects.toThrow('signed-in user');
  });
});
