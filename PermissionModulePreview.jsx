import { useMemo, useState } from "react";

// Standalone preview of the permission catalog + role-permission mapping UI,
// using fixture data so it's viewable without a backend. The real pages
// (pages/PermissionCatalogPage.jsx, pages/RolePermissionMappingPage.jsx) use
// the same visual language but call the live API instead.

const permissions = [
  { id: "p1", key: "users:read", label: "View users", module: "Users", description: "View user profiles and account details." },
  { id: "p2", key: "users:write", label: "Edit users", module: "Users", description: "Create, update, or deactivate user accounts." },
  { id: "p3", key: "billing:read", label: "View billing", module: "Billing", description: "View invoices, plans, and payment history." },
  { id: "p4", key: "billing:write", label: "Manage billing", module: "Billing", description: "Change plans, update payment methods, issue refunds." },
  { id: "p5", key: "reports:read", label: "View reports", module: "Reports", description: "Access dashboards and exported reports." },
  { id: "p6", key: "reports:export", label: "Export reports", module: "Reports", description: "Download report data as CSV/PDF." },
  { id: "p7", key: "settings:write", label: "Manage settings", module: "Settings", description: "Change org-wide configuration." },
  { id: "p8", key: "audit:read", label: "View audit log", module: "Settings", description: "Read the org's security and access audit trail." },
];

const roles = [
  { id: "r1", name: "Admin" },
  { id: "r2", name: "Manager" },
  { id: "r3", name: "Support" },
  { id: "r4", name: "Viewer" },
];

const initialGrants = {
  "r1:p1": true, "r1:p2": true, "r1:p3": true, "r1:p4": true,
  "r1:p5": true, "r1:p6": true, "r1:p7": true, "r1:p8": true,
  "r2:p1": true, "r2:p2": true, "r2:p5": true, "r2:p6": true,
  "r3:p1": true, "r3:p5": true,
  "r4:p1": true, "r4:p5": true,
};

export default function PermissionModulePreview() {
  const [tab, setTab] = useState("catalog");

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#E7EAF0]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8 flex items-center gap-1 rounded-md border border-[#22314A] bg-[#121B2E] p-1 w-fit">
          <TabButton active={tab === "catalog"} onClick={() => setTab("catalog")}>
            Permission catalog
          </TabButton>
          <TabButton active={tab === "mapping"} onClick={() => setTab("mapping")}>
            Role mapping
          </TabButton>
        </div>
        {tab === "catalog" ? <CatalogView /> : <MappingView />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-[#5B6EF5] text-white" : "text-[#8B99B3] hover:text-[#E7EAF0]"
      }`}
    >
      {children}
    </button>
  );
}

function CatalogView() {
  const [query, setQuery] = useState("");
  const [activeModule, setActiveModule] = useState("All");

  const modules = useMemo(() => ["All", ...new Set(permissions.map((p) => p.module))], []);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = permissions.filter((p) => {
      const matchesModule = activeModule === "All" || p.module === activeModule;
      const matchesQuery = !q || p.key.includes(q) || p.label.toLowerCase().includes(q);
      return matchesModule && matchesQuery;
    });
    const map = new Map();
    for (const p of filtered) {
      if (!map.has(p.module)) map.set(p.module, []);
      map.get(p.module).push(p);
    }
    return Array.from(map.entries());
  }, [query, activeModule]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search permissions"
          className="w-full rounded-md border border-[#22314A] bg-[#121B2E] px-3 py-2 text-sm placeholder:text-[#5D6B85] focus:border-[#5B6EF5] focus:outline-none sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {modules.map((m) => (
            <button
              key={m}
              onClick={() => setActiveModule(m)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                activeModule === m
                  ? "border-[#5B6EF5] bg-[#5B6EF5]/15 text-[#B7C0FF]"
                  : "border-[#22314A] text-[#8B99B3]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-8">
        {grouped.map(([module, items]) => (
          <section key={module}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#5D6B85]">
              {module}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((p) => (
                <div key={p.id} className="rounded-lg border border-[#22314A] bg-[#121B2E] p-4">
                  <p className="text-sm font-medium text-[#F4F6FA]">{p.label}</p>
                  <p className="mt-0.5 font-mono text-xs text-[#8B99B3]">{p.key}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#A7B2C6]">{p.description}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function MappingView() {
  const [grants, setGrants] = useState(initialGrants);
  const [changed, setChanged] = useState(new Set());

  const toggle = (roleId, permId) => {
    const key = `${roleId}:${permId}`;
    setGrants((prev) => ({ ...prev, [key]: !prev[key] }));
    setChanged((prev) => new Set(prev).add(key));
  };

  return (
    <div>
      {changed.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-md border border-[#3A4A66] bg-[#121B2E] px-4 py-2 w-fit">
          <span className="text-sm text-[#E5A93E]">
            {changed.size} unsaved {changed.size === 1 ? "change" : "changes"}
          </span>
          <button
            onClick={() => setChanged(new Set())}
            className="rounded-md bg-[#5B6EF5] px-3 py-1 text-sm font-medium text-white"
          >
            Save changes
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-[#22314A]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 min-w-[200px] border-b border-[#22314A] bg-[#121B2E] px-4 py-3 text-left font-medium text-[#8B99B3]">
                Permission
              </th>
              {roles.map((r) => (
                <th key={r.id} className="min-w-[100px] border-b border-l border-[#22314A] bg-[#121B2E] px-3 py-3 text-center font-medium text-[#8B99B3]">
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((p, i) => (
              <tr key={p.id} className={i % 2 === 0 ? "bg-[#0E1626]" : "bg-[#0B1220]"}>
                <td className="sticky left-0 border-b border-[#1B283F] bg-inherit px-4 py-3">
                  <p className="text-[#F4F6FA]">{p.label}</p>
                  <p className="font-mono text-xs text-[#5D6B85]">{p.key}</p>
                </td>
                {roles.map((r) => {
                  const key = `${r.id}:${p.id}`;
                  const granted = !!grants[key];
                  const dirty = changed.has(key);
                  return (
                    <td key={r.id} className="border-b border-l border-[#1B283F] px-3 py-3 text-center">
                      <button
                        onClick={() => toggle(r.id, p.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          granted ? "bg-[#35B37E]" : "bg-[#26324A]"
                        } ${dirty ? "ring-2 ring-[#E5A93E] ring-offset-2 ring-offset-[#0B1220]" : ""}`}
                      >
                        <span
                          className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
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
    </div>
  );
}
