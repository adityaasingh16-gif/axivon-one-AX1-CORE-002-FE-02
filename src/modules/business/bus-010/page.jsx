import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useOrg } from '../../../context/OrgContext';
import { businessRequest } from '../businessApi';
import { BusinessModuleState } from '../BusinessModuleState';

export const moduleManifest = {
  id: 'BUS-010',
  path: '/business/billing',
  title: 'Billing',
  description: 'Create invoices, review balances, and track payment records.',
};

const statuses = ['all', 'unpaid', 'partially_paid', 'paid', 'overdue', 'void'];
const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};
const formatMoney = (value, currency) => {
  const code = /^[A-Z]{3}$/.test(currency || '') ? currency : 'INR';
  const amount = Number(value);
  try {
    const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: code });
    const digits = formatter.resolvedOptions().maximumFractionDigits;
    return formatter.format((Number.isFinite(amount) ? amount : 0) / (10 ** digits));
  } catch {
    return `${code} ${((Number.isFinite(amount) ? amount : 0) / 100).toFixed(2)}`;
  }
};

export default function BillingPage() {
  const { token } = useAuth();
  const { activeOrg } = useOrg();
  const [invoices, setInvoices] = useState([]);
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
      const result = await businessRequest('/api/v1/invoices?' + params.toString(), {
        token, organizationId: activeOrg?.id, signal,
      });
      setInvoices(Array.isArray(result) ? result : Array.isArray(result?.items) ? result.items : []);
    } catch (cause) {
      if (cause?.name !== 'AbortError') setError(cause instanceof Error ? cause.message : 'Unable to load invoices.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [token, activeOrg?.id, applied]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const applyFilters = (event) => {
    event.preventDefault();
    setApplied({ search, status });
  };
  const totalDue = invoices.reduce((sum, invoice) => sum + Number(invoice.amountDue ?? invoice.totalAmount ?? 0), 0);

  return (
    <section className="grid gap-5" aria-label="Invoice workspace">
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoices shown</p><strong className="mt-2 block text-2xl">{invoices.length}</strong></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Outstanding amount</p><strong className="mt-2 block text-2xl">{formatMoney(totalDue, invoices[0]?.currency)}</strong></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Related workspaces</p><div className="mt-2 flex flex-wrap gap-3"><Link className="font-semibold text-indigo-600" to="/business/payments">Payments</Link><Link className="font-semibold text-indigo-600" to="/business/services">Services</Link></div></article>
      </div>
      <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className="grid gap-1 text-sm font-medium text-slate-700">Find invoices
          <input className="decent-input min-w-56" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Invoice number or customer" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">Status
          <select className="decent-input" value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((value) => <option key={value} value={value}>{value === 'all' ? 'All statuses' : value.replaceAll('_', ' ')}</option>)}</select>
        </label>
        <button className="decent-btn-primary" type="submit">Apply filters</button>
      </form>
      {loading ? <BusinessModuleState state="loading" message="Loading invoices…" /> :
        error ? <BusinessModuleState state="error" title="Invoices could not be loaded" message={error} onRetry={() => void load()} /> :
        invoices.length === 0 ? <BusinessModuleState state="empty" title="No invoices found" message="Invoices will appear here when they are available. You can browse service offerings or payment records from the module navigation." /> :
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>
              <th scope="col" className="px-4 py-3">Invoice</th><th scope="col" className="px-4 py-3">Customer</th>
              <th scope="col" className="px-4 py-3">Issued</th><th scope="col" className="px-4 py-3">Due date</th>
              <th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3">Amount due</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">{invoices.map((invoice) => <tr key={invoice.id}>
              <td className="px-4 py-3 font-semibold text-slate-800">{invoice.invoiceNumber || invoice.id}</td>
              <td className="px-4 py-3">{invoice.customerName || invoice.customerId || '—'}</td>
              <td className="px-4 py-3">{formatDate(invoice.issuedAt || invoice.createdAt)}</td>
              <td className="px-4 py-3">{formatDate(invoice.dueDate)}</td>
              <td className="px-4 py-3 capitalize">{String(invoice.status || 'unpaid').replaceAll('_', ' ')}</td>
              <td className="px-4 py-3">{formatMoney(invoice.amountDue ?? invoice.totalAmount, invoice.currency)}</td>
            </tr>)}</tbody>
          </table>
        </div>
      }
    </section>
  );
}
