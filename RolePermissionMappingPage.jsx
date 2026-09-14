// pages/RolePermissionMappingPage.jsx
//
// Matrix UI: permissions as rows, roles as columns, a toggle per cell.
// Changes are staged locally and saved as a batch so an admin can flip
// several cells before committing — avoids one network call per click.

import { useEffect, useMemo, useState } from "react";
import {
  fetchPermissions,
  fetchRoles,
  fetchRolePermissionMap,
  saveRolePermissionBatch,
} from "../services/permissionApi";

export default function RolePermissionMappingPage() {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [grantMap, setGrantMap] = useState({}); // key: `${roleId}:${permissionId}` -> boolean
  const [pendingChanges, setPendingChanges] = useState({}); // same key -> boolean
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([fetchPermissions(), fetchRoles(), fetchRolePermissionMap()])
      .then(([perms, roleList, mapEntries]) => {
        if (cancelled) return;
        setPermissions(perms);
        setRoles(roleList);
        const map = {};
        for (const entry of mapEntries) {
          map[`${entry.roleId}:${entry.permissionId}`] = entry.granted;
        }
        setGrantMap(map);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const visiblePermissions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter(
      (p) =>
        p.key.toLowerCase().includes(q) ||
        p.label.toLowerCase().includes(q) ||
        p.module.toLowerCase().includes(q)
    );
  }, [permissions, query]);

  const isGranted = (roleId, permissionId) => {
    const key = `${roleId}:${permissionId}`;
    return key in pendingChanges ? pendingChanges[key] : !!grantMap[key];
  };

  const toggleCell = (roleId, permissionId) => {
    const key = `${roleId}:${permissionId}`;
    const current = isGranted(roleId, permissionId);
    setPendingChanges((prev) => ({ ...prev, [key]: !current }));
  };

  const changeCount = Object.keys(pendingChanges).length;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    const changes = Object.entries(pendingChanges).map(([key, granted]) => {
      const [roleId, permissionId] = key.split(":");
      return { roleId, permissionId, granted };
    });
    try {
      await saveRolePermissionBatch(changes);
      setGrantMap((prev) => ({ ...prev, ...pendingChanges }));
      setPendingChanges({});
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => setPendingChanges({});

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E7EAF0]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#F4F6FA]">
              Role-permission mapping
            </h1>
            <p className="mt-1 text-sm text-[#8B99B3]">
              Toggle a cell to grant or revoke a permission for a role, then save.
            </p>
          </div>
          {changeCount > 0 && (
            <div className="flex items-center gap-3 rounded-md border border-[#3A4A66] bg-[#121B2E] px-4 py-2">
              <span className="text-sm text-[#E5A93E]">
                {changeCount} unsaved {changeCount === 1 ? "change" : "changes"}
              </span>
              <button
                onClick={handleDiscard}
                disabled={isSaving}
                className="text-sm text-[#8B99B3] hover:text-[#E7EAF0]"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-md bg-[#5B6EF5] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#4A5BE0] disabled:opacity-60"
              >
                {isSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          )}
        </header>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter permissions by key, name, or module"
          className="mb-6 w-full max-w-sm rounded-md border border-[#22314A] bg-[#121B2E] px-3 py-2 text-sm text-[#E7EAF0] placeholder:text-[#5D6B85] focus:border-[#5B6EF5] focus:outline-none focus:ring-1 focus:ring-[#5B6EF5]"
        />

        {isLoading && <p className="py-8 text-sm text-[#8B99B3]">Loading roles and permissions…</p>}
        {error && <p className="py-4 text-sm text-[#E5484D]">{error}</p>}

        {!isLoading && !error && (
          <div className="overflow-x-auto rounded-lg border border-[#22314A]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-[220px] border-b border-[#22314A] bg-[#121B2E] px-4 py-3 text-left font-medium text-[#8B99B3]">
                    Permission
                  </th>
                  {roles.map((role) => (
                    <th
                      key={role.id}
                      className="min-w-[110px] border-b border-l border-[#22314A] bg-[#121B2E] px-3 py-3 text-center font-medium text-[#8B99B3]"
                      title={role.description}
                    >
                      {role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visiblePermissions.map((permission, i) => (
                  <tr key={permission.id} className={i % 2 === 0 ? "bg-[#0E1626]" : "bg-[#0B1220]"}>
                    <td className="sticky left-0 z-10 border-b border-[#1B283F] bg-inherit px-4 py-3">
                      <p className="text-[#F4F6FA]">{permission.label}</p>
                      <p className="font-mono text-xs text-[#5D6B85]">{permission.key}</p>
                    </td>
                    {roles.map((role) => {
                      const granted = isGranted(role.id, permission.id);
                      const dirty =
                        `${role.id}:${permission.id}` in pendingChanges;
                      return (
                        <td
                          key={role.id}
                          className="border-b border-l border-[#1B283F] px-3 py-3 text-center"
                        >
                          <button
                            role="switch"
                            aria-checked={granted}
                            aria-label={`${permission.key} for ${role.name}`}
                            onClick={() => toggleCell(role.id, permission.id)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              granted ? "bg-[#35B37E]" : "bg-[#26324A]"
                            } ${dirty ? "ring-2 ring-[#E5A93E] ring-offset-2 ring-offset-[#0B1220]" : ""}`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                granted ? "translate-x-4.5" : "translate-x-1"
                              }`}
                              style={{ transform: granted ? "translateX(18px)" : "translateX(4px)" }}
                            />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
