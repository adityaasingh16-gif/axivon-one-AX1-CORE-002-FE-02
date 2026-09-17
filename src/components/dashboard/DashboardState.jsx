import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';

export const DashboardState = ({ type, title, message, onRetry }) => {
  const isError = type === 'error';
  const Icon = isError ? AlertCircle : Inbox;

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`rounded-2xl border p-8 text-center ${
        isError ? 'border-red-200 bg-red-50/70' : 'border-slate-200 bg-white'
      }`}
    >
      <Icon className={`mx-auto h-8 w-8 ${isError ? 'text-red-500' : 'text-slate-400'}`} aria-hidden="true" />
      <h2 className="mt-3 text-sm font-bold text-slate-900">{title}</h2>
      <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-slate-500">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
};

export const DashboardSkeleton = () => (
  <div className="space-y-6" aria-label="Loading dashboard" role="status">
    <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-slate-200" />)}
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="h-72 animate-pulse rounded-2xl bg-slate-200 lg:col-span-2" />
      <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
    </div>
    <span className="sr-only">Loading dashboard data…</span>
  </div>
);
