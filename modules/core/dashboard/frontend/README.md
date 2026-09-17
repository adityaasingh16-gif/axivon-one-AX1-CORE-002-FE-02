# CORE-006 Dashboard Frontend

Phase 1 dashboard implementation for AX1-CORE-006-FE-P1.

## Included
- Protected `/dashboard` route using the existing `SidebarLayout` shell.
- Reusable KPI cards and dashboard widgets.
- Dashboard API adapter with optional `VITE_DASHBOARD_API_URL` integration and local mock fallback.
- Loading, empty and error states with retry.
- Responsive grid layouts and keyboard/focus-friendly controls.
- Workspace, activity and active-session widgets connected to existing Auth/Org data.

## API response contract
The optional dashboard endpoint should return JSON with:

```json
{
  "generatedAt": "2026-09-17T12:00:00.000Z",
  "organization": {},
  "kpis": [],
  "activity": [],
  "sessions": []
}
```

`kpis` must be an array. The frontend validates this shape before rendering remote data.
