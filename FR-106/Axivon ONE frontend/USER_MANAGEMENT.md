# AXIVON ONE — User Management Architecture

## Routes

- `users.html` — Users list
- `user-details.html?id=<USER_ID>` — selected user profile/details
- `user-form.html` — create user
- `user-form.html?id=<USER_ID>` — edit user

Status and membership are managed from the profile and edit form.

## Shared state

`assets/js/users.js` exposes `AxivonUsers.State` and `AxivonUsers.Store`. State tracks:

- `users`
- `selectedUser`
- `formData`
- `loading` / `error` / `success`
- `searchQuery`
- `statusFilter`
- `membershipFilter`

Data persists in browser `localStorage` under `axivon_managed_users_v1`.

## Reusable components

`AxivonUsers.Components` contains the shared table, row, avatar, status badge, membership badge, data-state and profile/edit links.

## Data flow

List → select user → profile/details → edit/status/membership → save → localStorage → return to the updated profile.
