import { LeadManagementView } from './LeadManagementView.js';
import type { RouteDefinition, RouteMountContext } from '../../../routes/types.js';

export const LEAD_MANAGEMENT_ROUTE_PATH = '/leads';

const createMount = (activePath: string) => (context: RouteMountContext): void => {
  const view = new LeadManagementView({
    container: context.container,
    activePath,
  });
  view.render();
};

export const leadManagementRoutes: RouteDefinition[] = [
  {
    id: 'lead-management',
    path: '/leads',
    title: 'Lead Management',
    navLabel: 'Leads',
    ariaLabel: 'Go to Lead Management',
    mount: createMount('/leads'),
  },
  {
    id: 'lead-management-workspace',
    path: '/leads/workspace',
    title: 'Lead Workspace',
    navLabel: 'Lead Workspace',
    ariaLabel: 'Go to Lead Workspace',
    mount: createMount('/leads/workspace'),
  },
  {
    id: 'lead-management-activity',
    path: '/leads/activity',
    title: 'Lead Activity',
    navLabel: 'Lead Activity',
    ariaLabel: 'Go to Lead Activity',
    mount: createMount('/leads/activity'),
  },
];
