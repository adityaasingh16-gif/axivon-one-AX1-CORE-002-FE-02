# AX1-CORE-001-FE-02 — Authentication Primary UI

## Scope

This implementation covers the **primary presentation layer** for:

- Login
- Registration
- Account verification
- Password recovery
- Password reset
- Logout confirmation
- Session-expired state

## Architecture alignment

The UI is implemented under the task-defined repository area:

`apps/frontend/src/modules/core/authentication/`

The renderer is configuration-driven so the same component can render each authentication screen without client-specific branching or duplicated screen implementations.

## Intentionally outside FE-02

The following are deliberately not implemented here because they belong to later task IDs:

- FE-01: routing/state foundation
- FE-03: form interactions and client-side validation
- FE-04: API contracts and loading/success/error integration
- FE-05: final responsive/accessibility/functional review

The UI exposes an optional submit callback as a handoff point; it does not call APIs or implement business logic.

## Usage

```ts
import {
  getAuthScreenConfig,
  renderAuthScreen,
} from './modules/core/authentication/index.js';
import './modules/core/authentication/authentication.css';

const container = document.querySelector<HTMLElement>('#auth-root');
if (container) {
  renderAuthScreen(container, getAuthScreenConfig('login'));
}
```

## Task workflow

- Branch: `feature/AX1-CORE-001-FE-02`
- PR title: `[Frontend] AX1-CORE-001-FE-02 — Authentication Primary UI`
- Scope: one task / one branch / one PR
- No credentials, API keys, or secrets are included.
