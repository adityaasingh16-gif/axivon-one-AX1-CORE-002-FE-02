import type { LeadModuleState } from '../types.js';

export const renderLeadModuleState = (
  container: HTMLElement,
  state: LeadModuleState,
  errorMessage?: string,
  onRetry?: () => void,
): void => {
  if (state === 'ready') return;

  const stateElement = document.createElement('div');
  stateElement.className = 'business-module__state';
  stateElement.setAttribute('role', state === 'error' ? 'alert' : 'status');

  if (state === 'loading') {
    stateElement.textContent = 'Loading Lead Management…';
  } else if (state === 'empty') {
    stateElement.textContent = 'No lead data is available yet.';
  } else {
    stateElement.classList.add('business-module__state--error');

    const message = document.createElement('span');
    message.textContent = errorMessage ?? 'Please try again.';
    stateElement.appendChild(message);

    if (onRetry) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Retry';
      button.addEventListener('click', onRetry);
      stateElement.appendChild(button);
    }
  }

  container.appendChild(stateElement);
};
