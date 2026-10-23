import React from 'react';

export function BusinessModuleState({ state, title, message, onRetry }) {
  if (state === 'loading') {
    return <section className="business-state" role="status" aria-live="polite"><span className="business-state__spinner" aria-hidden="true" />{message || 'Loading…'}</section>;
  }
  if (state === 'empty') {
    return <section className="business-state" role="status"><h2>{title || 'Nothing to show yet'}</h2><p>{message || 'Records will appear here when they are available.'}</p></section>;
  }
  if (state === 'error') {
    return <section className="business-state business-state--error" role="alert"><h2>{title || 'This page could not load'}</h2><p>{message || 'Check your connection and try again.'}</p>{onRetry && <button type="button" onClick={onRetry}>Retry</button>}</section>;
  }
  return null;
}
