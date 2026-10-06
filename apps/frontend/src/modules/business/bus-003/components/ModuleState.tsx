import type { ModuleState as State } from '../contracts';

export function ModuleState({ state, errorMessage, onRetry }: { state: State; errorMessage?: string; onRetry?: () => void }) {
  if (state === 'loading') return <div className="bus003-state" role="status" aria-live="polite">Loading module…</div>;
  if (state === 'empty') return <div className="bus003-state" role="status">Nothing to display yet.</div>;
  if (state === 'error') {
    return (
      <div className="bus003-state bus003-state--error" role="alert">
        <strong>Unable to load this module.</strong>
        <span>{errorMessage ?? 'Please try again.'}</span>
        {onRetry ? <button type="button" onClick={onRetry}>Retry</button> : null}
      </div>
    );
  }
  return null;
}
