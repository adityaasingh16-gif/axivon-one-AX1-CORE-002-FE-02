export interface RouteMountContext {
  container: HTMLElement;
}

export interface RouteDefinition {
  id: string;
  path: string;
  title: string;
  navLabel: string;
  ariaLabel?: string;
  mount: (context: RouteMountContext) => void | Promise<void>;
}
