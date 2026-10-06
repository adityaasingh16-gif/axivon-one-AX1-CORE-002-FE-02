import { BusinessModuleScreen } from './BusinessModuleScreen';

export const businessModuleRoutes = [
  { path: '/business', element: BusinessModuleScreen },
  { path: '/business/overview', element: BusinessModuleScreen },
  { path: '/business/workspace', element: BusinessModuleScreen },
  { path: '/business/activity', element: BusinessModuleScreen },
] as const;
