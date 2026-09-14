// routes/permissionRoutes.jsx
//
// Route objects for the permissions module. Import PERMISSION_ROUTES into
// your app's top-level router (createBrowserRouter / <Routes>) or spread it
// as children of an authenticated admin layout route.
//
// Example wiring in your root router:
//
//   import { PERMISSION_ROUTES } from "./routes/permissionRoutes";
//   const router = createBrowserRouter([
//     {
//       path: "/admin",
//       element: <AdminLayout />,
//       children: [...PERMISSION_ROUTES],
//     },
//   ]);

import { lazy } from "react";
import RequirePermission from "../components/RequirePermission";

const PermissionCatalogPage = lazy(() => import("../pages/PermissionCatalogPage"));
const RolePermissionMappingPage = lazy(() => import("../pages/RolePermissionMappingPage"));

export const PERMISSION_ROUTE_PATHS = {
  catalog: "permissions",
  mapping: "permissions/roles",
};

export const PERMISSION_ROUTES = [
  {
    path: PERMISSION_ROUTE_PATHS.catalog,
    element: (
      <RequirePermission permission="settings:write">
        <PermissionCatalogPage />
      </RequirePermission>
    ),
  },
  {
    path: PERMISSION_ROUTE_PATHS.mapping,
    element: (
      <RequirePermission permission="settings:write">
        <RolePermissionMappingPage />
      </RequirePermission>
    ),
  },
];
