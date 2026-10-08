import type { ModuleNavItem } from './contracts';

/** Route metadata only. Bind these paths to the application's existing router; no backend endpoints are invented here. */
export const moduleRoutes: ModuleNavItem[] = [
  { id: 'overview', label: 'Overview', href: '/overview', description: 'Module overview' },
  { id: 'workspace', label: 'Workspace', href: '/workspace', description: 'Primary module workspace' },
  { id: 'settings', label: 'Settings', href: '/settings', description: 'Module preferences' },
];
