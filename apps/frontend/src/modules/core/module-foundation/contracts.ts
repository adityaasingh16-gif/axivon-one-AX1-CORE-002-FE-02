export type ModuleNavItem = { id: string; label: string; href: string; description?: string };

export type ModuleViewState = 'loading' | 'ready' | 'empty' | 'error';

export type ModuleShellProps = {
  title: string;
  description?: string;
  navigation: ModuleNavItem[];
  activeItemId?: string;
  state?: ModuleViewState;
  errorMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
};
