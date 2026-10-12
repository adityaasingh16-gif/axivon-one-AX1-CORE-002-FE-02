export type LeadModuleState = 'loading' | 'ready' | 'empty' | 'error';

export interface LeadModuleNavItem {
  id: 'overview' | 'workspace' | 'activity';
  label: string;
  path: string;
  description: string;
}

export interface LeadModuleViewOptions {
  container: HTMLElement;
  activePath?: string;
  state?: LeadModuleState;
  errorMessage?: string;
  onRetry?: () => void;
}
