import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useOrg } from '../../../context/OrgContext';
import { businessRequest } from '../businessApi';
import { BusinessModuleState } from '../BusinessModuleState';

export const moduleManifest = { id: 'BUS-013', path: '/business/reports', title: 'Reporting', description: 'Browse the reports available to your organization.' };

export default function ReportingPage() {
  const { token } = useAuth(); const { activeOrg } = useOrg();
  const [reports, setReports] = useState([]); const [query, setQuery] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async (signal) => {
    setLoading(true); setError('');
    try { const result = await businessRequest('/api/v1/reports', { token, organizationId: activeOrg?.id, signal }); setReports(Array.isArray(result) ? result : Array.isArray(result?.reports) ? result.reports : []); }
    catch (cause) { if (cause?.name !== 'AbortError') setError(cause instanceof Error ? cause.message : 'Unable to load reports.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [token, activeOrg?.id]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  const needle = query.trim().toLowerCase();
  const visible = reports.filter(r => [r.name, r.title, r.description, r.category, r.id].some(value => String(value || '').toLowerCase().includes(needle)));
  return <section className="grid gap-5" aria-label="Reporting workspace">
    <div className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Available reports</p><strong className="mt-2 block text-2xl">{reports.length}</strong></article>
      <article className="rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2"><h2 className="font-semibold text-slate-900">Connected workspaces</h2><div className="mt-2 flex flex-wrap gap-4"><Link className="font-semibold text-indigo-600" to="/business/billing">Billing</Link><Link className="font-semibold text-indigo-600" to="/business/services">Services</Link><Link className="font-semibold text-indigo-600" to="/business/payments">Payments</Link><Link className="font-semibold text-indigo-600" to="/business/employees">Employees</Link></div></article>
    </div>
    <label className="grid max-w-xl gap-1 text-sm font-medium text-slate-700">Search reports<input className="decent-input" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Report name, category, or description" /></label>
    {loading ? <BusinessModuleState state="loading" message="Loading report catalog…" /> : error ? <BusinessModuleState state="error" title="Reports could not be loaded" message={error} onRetry={() => void load()} /> :
      visible.length === 0 ? <BusinessModuleState state="empty" title={reports.length ? 'No matching reports' : 'No reports available yet'} message={reports.length ? 'Try a different search term.' : 'Available reports will appear here when configured for your organization.'} /> :
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visible.map(report => <article key={report.id || report.code || report.name} className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{report.category || 'Report'}</p><h2 className="mt-2 text-lg font-semibold text-slate-900">{report.title || report.name || report.id}</h2>
        <p className="mt-2 text-sm text-slate-600">{report.description || 'Report details are available in the reporting workspace.'}</p>{report.updatedAt && <p className="mt-4 text-xs text-slate-500">Updated {new Date(report.updatedAt).toLocaleDateString()}</p>}
      </article>)}</div>}
  </section>;
}
