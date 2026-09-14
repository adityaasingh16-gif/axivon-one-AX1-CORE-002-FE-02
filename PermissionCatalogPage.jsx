// pages/PermissionCatalogPage.jsx
//
// Lists every permission in the system, grouped by module, with search and
// module filtering. Permission keys (e.g. "users:read") are shown in
// monospace since they're literal identifiers used in code and API
// payloads — devs and admins recognize that shape.

import { useEffect, useMemo, useState } from "react";
import { fetchPermissions, createPermission } from "../services/permissionApi";

export default function PermissionCatalogPage() {
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [activeModule, setActiveModule] = useState("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchPermissions()
      .then((data) => !cancelled && setPermissions(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const modules = useMemo(() => {
    const set = new Set(permissions.map((p) => p.module));
    return ["All", ...Array.from(set).sort()];
  }, [permissions]);

  const filtered = useMemo(() => {
    return permissions.filter((p) => {
      const matchesModule = activeModule === "All" || p.module === activeModule;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.key.toLowerCase().includes(q) ||
        p.label.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);
      return matchesModule && matchesQuery;
    });
  }, [permissions, activeModule, query]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const p of filtered) {
      if (!map.has(p.module)) map.set(p.module, []);
      map.get(p.module).push(p);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E7EAF0]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#F4F6FA]">
              Permission catalog
            </h1>
            <p className="mt-1 text-sm text-[#8B99B3]">
              Every permission defined in the system, grouped by module.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="shrink-0 rounded-md bg-[#5B6EF5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4A5BE0]"
          >
            New permission
          </button>
        </header>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by key, name, or description"
            className="w-full rounded-md border border-[#22314A] bg-[#121B2E] px-3 py-2 text-sm text-[#E7EAF0] placeholder:text-[#5D6B85] focus:border-[#5B6EF5] focus:outline-none focus:ring-1 focus:ring-[#5B6EF5] sm:max-w-sm"
          />
          <div className="flex flex-wrap gap-2">
            {modules.map((m) => (
              <button
                key={m}
                onClick={() => setActiveModule(m)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  activeModule === m
                    ? "border-[#5B6EF5] bg-[#5B6EF5]/15 text-[#B7C0FF]"
                    : "border-[#22314A] text-[#8B99B3] hover:border-[#3A4A66] hover:text-[#E7EAF0]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {isLoading && <StateMessage text="Loading permissions…" />}
        {error && <StateMessage text={`Couldn't load permissions: ${error}`} isError />}
        {!isLoading && !error && grouped.length === 0 && (
          <StateMessage text="No permissions match your search." />
        )}

        <div className="space-y-10">
          {grouped.map(([module, items]) => (
            <section key={module}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#5D6B85]">
                {module}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((permission) => (
                  <PermissionCard key={permission.id} permission={permission} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {isCreateOpen && (
        <CreatePermissionModal
          modules={modules.filter((m) => m !== "All")}
          onClose={() => setIsCreateOpen(false)}
          onCreated={(p) => {
            setPermissions((prev) => [...prev, p]);
            setIsCreateOpen(false);
          }}
        />
      )}
    </div>
  );
}

function PermissionCard({ permission }) {
  return (
    <div className="rounded-lg border border-[#22314A] bg-[#121B2E] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#F4F6FA]">{permission.label}</p>
          <p className="mt-0.5 font-mono text-xs text-[#8B99B3]">{permission.key}</p>
        </div>
      </div>
      {permission.description && (
        <p className="mt-2 text-sm leading-relaxed text-[#A7B2C6]">
          {permission.description}
        </p>
      )}
    </div>
  );
}

function StateMessage({ text, isError }) {
  return (
    <p className={`py-8 text-sm ${isError ? "text-[#E5484D]" : "text-[#8B99B3]"}`}>
      {text}
    </p>
  );
}

function CreatePermissionModal({ modules, onClose, onCreated }) {
  const [form, setForm] = useState({ key: "", label: "", module: modules[0] || "", description: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const created = await createPermission(form);
      onCreated(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-lg border border-[#22314A] bg-[#121B2E] p-6">
        <h2 className="text-lg font-semibold text-[#F4F6FA]">New permission</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Field label="Key" hint="e.g. reports:delete">
            <input
              required
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              className="w-full rounded-md border border-[#22314A] bg-[#0B1220] px-3 py-2 font-mono text-sm text-[#E7EAF0] focus:border-[#5B6EF5] focus:outline-none"
              placeholder="module:action"
            />
          </Field>
          <Field label="Display name">
            <input
              required
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full rounded-md border border-[#22314A] bg-[#0B1220] px-3 py-2 text-sm text-[#E7EAF0] focus:border-[#5B6EF5] focus:outline-none"
            />
          </Field>
          <Field label="Module">
            <input
              required
              value={form.module}
              onChange={(e) => setForm({ ...form, module: e.target.value })}
              className="w-full rounded-md border border-[#22314A] bg-[#0B1220] px-3 py-2 text-sm text-[#E7EAF0] focus:border-[#5B6EF5] focus:outline-none"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-md border border-[#22314A] bg-[#0B1220] px-3 py-2 text-sm text-[#E7EAF0] focus:border-[#5B6EF5] focus:outline-none"
            />
          </Field>

          {error && <p className="text-sm text-[#E5484D]">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-[#8B99B3] hover:text-[#E7EAF0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-[#5B6EF5] px-4 py-2 text-sm font-medium text-white hover:bg-[#4A5BE0] disabled:opacity-60"
            >
              {isSaving ? "Creating…" : "Create permission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[#8B99B3]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[#5D6B85]">{hint}</span>}
    </label>
  );
}
