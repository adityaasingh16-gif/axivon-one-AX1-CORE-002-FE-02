// components/RequirePermission.jsx
//
// Wraps a route element and only renders it if the current user holds the
// given permission key. Adjust useCurrentUser() to whatever your app's auth
// context actually exposes (JWT claims, session context, etc.).

import { Navigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function RequirePermission({ permission, children }) {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) return null;

  const hasAccess = user?.permissions?.includes(permission);

  if (!hasAccess) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
