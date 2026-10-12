// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { LeadManagementView } from '../LeadManagementView.js';
import { leadManagementRoutes } from '../routes.js';
import { LEAD_MODULE_NAVIGATION } from '../components/module-nav.js';

describe('BUS-003 Lead Management foundation', () => {
  it('defines overview, workspace and activity navigation', () => {
    expect(LEAD_MODULE_NAVIGATION.map((item) => item.path)).toEqual([
      '/leads',
      '/leads/workspace',
      '/leads/activity',
    ]);
  });

  it('exposes route definitions with mount handlers', () => {
    expect(leadManagementRoutes).toHaveLength(3);
    expect(leadManagementRoutes.every((route) => typeof route.mount === 'function')).toBe(true);
  });

  it('renders the module foundation', () => {
    const container = document.createElement('div');
    const view = new LeadManagementView({ container });
    view.render();

    expect(container.querySelector('h1')?.textContent).toBe('Lead Management');
    expect(container.querySelector('[aria-current="page"]')?.getAttribute('href')).toBe('/leads');
    expect(container.textContent).toContain('API-ready');
  });

  it('renders loading, empty and error states', () => {
    const container = document.createElement('div');

    new LeadManagementView({ container, state: 'loading' }).render();
    expect(container.textContent).toContain('Loading Lead Management');

    new LeadManagementView({ container, state: 'empty' }).render();
    expect(container.textContent).toContain('No lead data is available yet.');

    const onRetry = vi.fn();
    new LeadManagementView({
      container,
      state: 'error',
      errorMessage: 'API unavailable',
      onRetry,
    }).render();

    expect(container.textContent).toContain('API unavailable');
    container.querySelector<HTMLButtonElement>('[data-action="retry"]')?.click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
