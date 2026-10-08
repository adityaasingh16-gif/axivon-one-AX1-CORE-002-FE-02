import type { ModuleViewState } from './contracts';

type Props = { state: ModuleViewState; errorMessage?: string; onRetry?: () => void };

export function ModuleState({ state, errorMessage, onRetry }: Props) {
  if (state === 'ready') return null;
  if (state === 'loading') return <p role="status" aria-live="polite">Loading…</p>;
  if (state === 'empty') return <p role="status" aria-live="polite">No data available yet.</p>;
  return (
    <section role="alert" aria-live="assertive">
      <p>{errorMessage ?? 'Something went wrong.'}</p>
      {onRetry ? <button type="button" onClick={onRetry}>Retry</button> : null}
    </section>
  );
}
