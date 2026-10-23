import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useOrg } from '../../../context/OrgContext';
import { businessRequest } from '../businessApi';
import { BusinessModuleState } from '../BusinessModuleState';

export const moduleManifest = {
  id: 'BUS-009',
  path: '/business/services',
  title: 'Service Management',
  description: 'Manage service offerings, delivery duration, pricing, and availability.',
};

const statusOptions = ['all', 'active', 'inactive', 'archived'];
const escapeDate = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString();
};

export default function ServiceManagementPage() {
  const { token } = useAuth();
  const { activeOrg } = useOrg();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [applied, setApplied] = useState({ search: '', status: 'all' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (applied.search.trim()) params.set('search', applied.search.trim());
      if (applied.status !== 'all') params.set('status', applied.status);
      const result = await businessRequest('/api/v1/services?' + params.toString(), {
        token, organizationId: activeOrg?.id, signal,
      });
      setItems(Array.isArray(result) ? result : Array.isArray(result?.items) ? result.items : []);
    } catch (cause) {
      if (cause?.name !== 'AbortError') setError(cause instanceof Error ? cause.message : 'Unable to load services.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [token, activeOrg?.id, applied]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const submitFilters = (event) => {
    event.preventDefault();
    setApplied({ search, status });
  };

  const money = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR' }).format(amount) : '—';
  };

  return (
    <section aria-label="Service catalog" className="grid gap-5">
      <form onSubmit={submitFilters} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className="grid gap-1 text-sm font-medium text-slate-700">Search services
          <input className="decent-input min-w-56" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or service code" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">Status
          <select className="decent-input" value={status} onChange={(event) => setStatus(event.target.value)}>{statusOptions.map((value) => <option key={value} value={value}>{value === 'all' ? 'All statuses' : value}</option>)}</select>
        </label>
        <button className="decent-btn-primary" type="submit">Apply filters</button>
      </form>

      {loading ? <BusinessModuleState state="loading" message="Loading services…" /> :
        error ? <BusinessModuleState state="error" title="Services could not be loaded" message={error} onRetry={() => void load()} /> :
        items.length === 0 ? <BusinessModuleState state="empty" title="No services found" message="Add services when your organization’s catalog is ready, or adjust your filters." /> :
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>
              <th scope="col" className="px-4 py-3">Service</th><th scope="col" className="px-4 py-3">Code</th>
              <th scope="col" className="px-4 py-3">Category</th><th scope="col" className="px-4 py-3">Duration</th>
              <th scope="col" className="px-4 py-3">Price</th><th scope="col" className="px-4 py-3">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">{items.map((service) => <tr key={service.id}>
              <td className="px-4 py-3 font-semibold text-slate-800">{service.name}</td><td className="px-4 py-3">{service.code || '—'}</td>
              <td className="px-4 py-3">{service.category || '—'}</td><td className="px-4 py-3">{service.durationMinutes ? service.durationMinutes + ' min' : '—'}</td>
              <td className="px-4 py-3">{money(service.price)}</td><td className="px-4 py-3 capitalize">{String(service.status || 'active').replaceAll('_', ' ')}</td>
            </tr>)}</tbody>
          </table>
        </div>
      }
      {!loading && !error && items.length > 0 && <p className="text-xs text-slate-500">{items.length} service record(s) · Updated view: {escapeDate(new Date().toISOString())}</p>}
    </section>
  );
}
