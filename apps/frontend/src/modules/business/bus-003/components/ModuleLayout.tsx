import type { ReactNode } from 'react';
import { ModuleNav } from './ModuleNav';
import { ModuleState } from './ModuleState';
import type { ModuleNavItem, ModuleState as State } from '../contracts';

export function ModuleLayout({ title, description, navigation, activePath, state = 'ready', errorMessage, onRetry, children }: {
  title: string;
  description: string;
  navigation: ModuleNavItem[];
  activePath?: string;
  state?: State;
  errorMessage?: string;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="bus003-shell">
      <header className="bus003-header">
        <div>
          <p className="bus003-eyebrow">AXIVON ONE</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
      <div className="bus003-body">
        <aside className="bus003-sidebar"><ModuleNav items={navigation} activePath={activePath} /></aside>
        <main className="bus003-content" aria-label={title}>
          <ModuleState state={state} errorMessage={errorMessage} onRetry={onRetry} />
          {state === 'ready' ? children : null}
        </main>
      </div>
    </div>
  );
}
