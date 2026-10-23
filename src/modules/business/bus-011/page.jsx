import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useOrg } from '../../../context/OrgContext';
import { businessRequest } from '../businessApi';
import { BusinessModuleState } from '../BusinessModuleState';

export const moduleManifest = { id: 'BUS-011', path: '/business/payments', title: 'Payments', description: 'Review payment activity and record transactions.' };
const statuses = ['all', 'pending', 'succeeded', 'failed', 'refunded'];
const money = (minor, currency = 'INR') => {
  const value = Number(minor); const code = /^[A-Z]{3}$/.test(currency) ? currency : 'INR';
  try { const digits = new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).resolvedOptions().maximumFractionDigits; return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format((Number.isFinite(value) ? value : 0) / 10 ** digits); }
  catch { return code + ' ' + ((Number.isFinite(value) ? value : 0) / 100).toFixed(2); }
};

export default function PaymentsPage() {
  const { token, user } = useAuth(); const { activeOrg } = useOrg();
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('all'); const [applied, setApplied] = useState({ search: '', status: 'all' });
  const [form, setForm] = useState({ invoiceId: '', amount: '', currency: 'INR', reference: '' }); const [saving, setSaving] = useState(false); const [formError, setFormError] = useState('');
  const load = useCallback(async (signal) => {
    setLoading(true); setError('');
    try { const params = new URLSearchParams({ page: '1', pageSize: '100' }); if (applied.search.trim()) params.set('search', applied.search.trim()); if (applied.status !== 'all') params.set('status', applied.status);
      const result = await businessRequest('/api/v1/payments?' + params, { token, organizationId: activeOrg?.id, signal });
      setItems(Array.isArray(result) ? result : Array.isArray(result?.items) ? result.items : []);
    } catch (e) { if (e?.name !== 'AbortError') setError(e instanceof Error ? e.message : 'Unable to load payments.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [token, activeOrg?.id, applied]);
  useEffect(() => { const c = new AbortController(); void load(c.signal); return () => c.abort(); }, [load]);
  const record = async (event) => {
    event.preventDefault(); setFormError('');
    const amount = Number(form.amount);
    if (!form.invoiceId.trim() || !Number.isSafeInteger(amount) || amount <= 0) { setFormError('Enter an invoice ID and a positive amount in minor units.'); return; }
    setSaving(true);
    try { await businessRequest('/api/v1/payments', { token, organizationId: activeOrg?.id, method: 'POST', body: { invoiceId: form.invoiceId.trim(), amount, currency: form.currency.toUpperCase(), reference: form.reference.trim() || undefined } }); setForm({ invoiceId: '', amount: '', currency: 'INR', reference: '' }); await load(); }
    catch (e) { setFormError(e instanceof Error ? e.message : 'Unable to record payment.'); } finally { setSaving(false); }
  };
  const canRecord = ['admin', 'owner', 'finance', 'accountant'].includes(String(user?.role || '').toLowerCase());
  return <section className="grid gap-5" aria-label="Payments workspace">
    {canRecord && <form onSubmit={record} className="grid gap-3 rounded-xl border bg-white p-4"><h2 className="text-lg font-semibold">Record a payment</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-1 text-sm">Invoice ID<input className="decent-input" required value={form.invoiceId} onChange={e => setForm({ ...form, invoiceId: e.target.value })} /></label>
      <label className="grid gap-1 text-sm">Amount (minor units)<input className="decent-input" type="number" min="1" step="1" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></label>
      <label className="grid gap-1 text-sm">Currency<input className="decent-input" required maxLength="3" pattern="[A-Za-z]{3}" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} /></label>
      <label className="grid gap-1 text-sm">Reference<input className="decent-input" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} /></label></div><p className="text-xs text-slate-500">Do not enter card numbers or security codes.</p>{formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}<div><button className="decent-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Record payment'}</button></div></form>}
    <form onSubmit={e => { e.preventDefault(); setApplied({ search, status }); }} className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
      <label className="grid gap-1 text-sm">Find payments<input className="decent-input min-w-56" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Invoice or reference" /></label>
      <label className="grid gap-1 text-sm">Status<select className="decent-input" value={status} onChange={e => setStatus(e.target.value)}>{statuses.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}</select></label><button className="decent-btn-primary">Apply filters</button></form>
    {loading ? <BusinessModuleState state="loading" message="Loading payments…" /> : error ? <BusinessModuleState state="error" title="Payments could not be loaded" message={error} onRetry={() => void load()} /> : !items.length ? <BusinessModuleState state="empty" title="No payments found" message="Recorded transactions will appear here. Review invoices in Billing." /> : <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase"><tr>{['Payment','Invoice','Date','Reference','Status','Amount'].map(x => <th key={x} scope="col" className="px-4 py-3">{x}</th>)}</tr></thead><tbody className="divide-y">{items.map(p => <tr key={p.id}><td className="px-4 py-3 font-semibold">{p.id}</td><td className="px-4 py-3"><Link className="text-indigo-600" to="/business/billing">{p.invoiceNumber || p.invoiceId || 'View billing'}</Link></td><td className="px-4 py-3">{p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}</td><td className="px-4 py-3">{p.reference || '—'}</td><td className="px-4 py-3 capitalize">{String(p.status || 'pending').replaceAll('_', ' ')}</td><td className="px-4 py-3">{money(p.amount, p.currency)}</td></tr>)}</tbody></table></div>}
  </section>;
}
