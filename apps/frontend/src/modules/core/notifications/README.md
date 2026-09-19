# Notifications — AX1-P2-SHARED-001-FE-P2

Employee: `FR-105`

## Scope

Implements the frontend notification layer for the shared services assignment:

- notification list with unread/read state
- notification detail loading
- mark read / mark unread interactions
- loading, empty, success and API error states
- notification preference UI with client-side validation
- accessible status/error announcements and semantic controls
- responsive layout and reduced-motion support
- framework-neutral API adapter so backend contracts remain the source of truth

## API integration

Implement `NotificationsApi` with the approved backend endpoints. The module intentionally does not invent routes or request payloads. Inject the adapter into `NotificationsController` and connect the controller to the selected application runtime.

## Review checklist

- Loading state shown before async list/detail/preferences operations.
- Empty state shown when the list contains no notifications.
- API failures are surfaced as user-readable alert messages and can be retried by the host UI.
- Read/unread actions update local state and unread count after the API confirms success.
- Preference saves are blocked when client-side validation fails.
- Buttons are keyboard accessible and controls expose appropriate state.
- `aria-live` is used for dynamic summaries/status messages.
- Tables are not required for notifications; list semantics are used instead.
- Mobile layout stacks notification content/actions below 640px.
- No unrelated features or backend business rules are added.

## Verification

Run the repository's existing test/lint/typecheck commands before opening the PR. The included tests cover validation, successful loading, read-state updates, API failures, and preference-save validation.
