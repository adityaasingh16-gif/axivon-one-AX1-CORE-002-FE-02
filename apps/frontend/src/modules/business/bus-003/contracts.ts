export type ModuleNavItem = {
  id: string;
  label: string;
  href: string;
  description?: string;
};

export type ModuleState = 'loading' | 'ready' | 'empty' | 'error';

export type ModuleShellProps = {
  title: string;
  description: string;
  navigation: ModuleNavItem[];
  activePath?: string;
  state?: ModuleState;
  errorMessage?: string;
  onRetry?: () => void;
};
