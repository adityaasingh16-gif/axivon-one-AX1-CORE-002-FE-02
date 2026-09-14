// hooks/useCurrentUser.js
//
// Placeholder — replace with the real hook from your app's auth context
// (e.g. useAuth() from an AuthProvider, or a Redux/Zustand selector).
// Must resolve to { user: { permissions: string[] }, isLoading: boolean }.

export function useCurrentUser() {
  return {
    user: { permissions: ["settings:write", "users:read", "billing:read"] },
    isLoading: false,
  };
}
