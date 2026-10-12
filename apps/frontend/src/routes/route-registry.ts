import type { RouteDefinition } from './types.js';

const routes = new Map<string, RouteDefinition>();

export const registerRoute = (route: RouteDefinition): void => {
  routes.set(route.path, route);
};

export const getRoute = (path: string): RouteDefinition | undefined => routes.get(path);

export const listRoutes = (): RouteDefinition[] => Array.from(routes.values());

export const hasRoute = (path: string): boolean => routes.has(path);

export const clearRoutes = (): void => {
  routes.clear();
};
