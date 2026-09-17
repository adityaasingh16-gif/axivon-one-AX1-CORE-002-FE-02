import React from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, ShieldCheck, Users, Gauge } from 'lucide-react';

const icons = {
  'security-score': ShieldCheck,
  'active-sessions': Activity,
  'workspace-members': Users,
  'seat-utilization': Gauge,
};

const statusClasses = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export const DashboardKpiCard = ({ metric }) => {
  const Icon = icons[metric.id] || Activity;
  const isNegative = typeof metric.trend === 'string' && metric.trend.startsWith('-');
  const isPositive = typeof metric.trend === 'string' && metric.trend.startsWith('+');

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`rounded-xl border p-2 ${statusClasses[metric.status] || statusClasses.info}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="truncate text-xs font-semibold text-slate-500">{metric.label}</p>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">KPI</span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <p className="text-3xl font-extrabold tracking-tight text-slate-900">
          {metric.value}
          {metric.suffix && <span className="ml-0.5 text-sm font-bold text-slate-500">{metric.suffix}</span>}
        </p>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${statusClasses[metric.status] || statusClasses.info}`}>
          {isNegative ? <ArrowDownRight className="h-3 w-3" aria-hidden="true" /> : isPositive ? <ArrowUpRight className="h-3 w-3" aria-hidden="true" /> : null}
          {metric.trend}
        </span>
      </div>

      <p className="mt-2 text-[11px] leading-4 text-slate-500">
        {metric.description} <span className="font-medium text-slate-400">{metric.trendLabel}</span>
      </p>
    </article>
  );
};
