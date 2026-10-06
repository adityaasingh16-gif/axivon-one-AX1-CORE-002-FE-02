import type { LeadModuleNavItem } from '../types.js';

export const LEAD_MODULE_NAVIGATION: LeadModuleNavItem[] = [
  { id: 'overview', label: 'Overview', path: '/leads', description: 'Module summary' },
  { id: 'workspace', label: 'Workspace', path: '/leads/workspace', description: 'Lead work area' },
  { id: 'activity', label: 'Activity', path: '/leads/activity', description: 'Recent lead activity' },
];

export const findLeadModuleNavigationItem = (path: string): LeadModuleNavItem | undefined =>
  LEAD_MODULE_NAVIGATION.find((item) => item.path === path);

export const renderLeadModuleNavigation = (container: HTMLElement, activePath: string): void => {
  const nav = document.createElement('nav');
  nav.className = 'business-module__nav';
  nav.setAttribute('aria-label', 'Lead Management navigation');

  const list = document.createElement('ul');
  list.className = 'business-module__nav-list';

  for (const item of LEAD_MODULE_NAVIGATION) {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'business-module__nav-link';
    link.href = item.path;
    link.textContent = item.label;
    link.setAttribute('data-description', item.description);

    if (activePath === item.path) {
      link.classList.add('business-module__nav-link--active');
      link.setAttribute('aria-current', 'page');
    }

    listItem.appendChild(link);
    list.appendChild(listItem);
  }

  nav.appendChild(list);
  container.appendChild(nav);
};
