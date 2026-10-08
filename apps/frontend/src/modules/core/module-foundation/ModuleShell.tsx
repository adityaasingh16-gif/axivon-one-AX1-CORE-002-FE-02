import type { ModuleShellProps } from './contracts';
import { ModuleNavigation } from './ModuleNavigation';
import { ModuleState } from './ModuleState';

export function ModuleShell({ title, description, navigation, activeItemId, state = 'ready', errorMessage, onRetry, children }: ModuleShellProps) {
  return (
    <div>
      <header>
        <p>AXIVON ONE</p>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </header>
      <div>
        <ModuleNavigation items={navigation} activeItemId={activeItemId} />
        <main id="module-content" tabIndex={-1}>
          <ModuleState state={state} errorMessage={errorMessage} onRetry={onRetry} />
          {state === 'ready' ? children : null}
        </main>
      </div>
    </div>
  );
}
