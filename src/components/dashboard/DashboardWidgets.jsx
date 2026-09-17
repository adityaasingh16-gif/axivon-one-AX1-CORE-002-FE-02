import React from 'react';
import { Activity, CheckCircle2, Clock3, Monitor, ShieldAlert, Users } from 'lucide-react';

const formatRelativeTime = (timestamp) => {
  const diff = Math.max(0, Date.now() - new Date(timestamp).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const DashboardActivityWidget = ({ activity }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="dashboard-activity-title">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 id="dashboard-activity-title" className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Activity className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          Recent activity
        </h2>
        <p className="mt-1 text-[11px] text-slate-500">Latest workspace security events.</p>
      </div>
      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">Live feed</span>
    </div>

    {activity.length === 0 ? (
      <div className="py-12 text-center">
        <Clock3 className="mx-auto h-7 w-7 text-slate-300" aria-hidden="true" />
        <p className="mt-2 text-xs font-semibold text-slate-700">No activity yet</p>
        <p className="mt-1 text-[11px] text-slate-400">Workspace events will appear here.</p>
      </div>
    ) : (
      <div className="mt-4 space-y-2.5">
        {activity.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800">{item.action}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">By {item.user}</p>
            </div>
            <time className="shrink-0 text-[10px] text-slate-400" dateTime={item.timestamp}>{formatRelativeTime(item.timestamp)}</time>
          </div>
        ))}
      </div>
    )}
  </section>
);

export const DashboardSessionsWidget = ({ sessions, onManage }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="dashboard-sessions-title">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 id="dashboard-sessions-title" className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Monitor className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          Active sessions
        </h2>
        <p className="mt-1 text-[11px] text-slate-500">Devices currently signed in.</p>
      </div>
      <button
        type="button"
        onClick={onManage}
        className="rounded-lg px-2 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        Manage
      </button>
    </div>

    {sessions.length === 0 ? (
      <div className="py-12 text-center">
        <ShieldAlert className="mx-auto h-7 w-7 text-slate-300" aria-hidden="true" />
        <p className="mt-2 text-xs font-semibold text-slate-700">No active sessions</p>
      </div>
    ) : (
      <div className="mt-4 space-y-2.5">
        {sessions.map((session) => (
          <div key={session.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Monitor className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">{session.deviceName}</p>
              <p className="truncate text-[10px] text-slate-500">{session.location}</p>
            </div>
            {session.isCurrent && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">Current</span>}
          </div>
        ))}
      </div>
    )}
  </section>
);

export const DashboardWorkspaceWidget = ({ organization, onManage }) => {
  if (!organization) {
    return (
      <section className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-5" aria-labelledby="dashboard-workspace-title">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-white p-2 text-indigo-600 shadow-sm"><Users className="h-4 w-4" aria-hidden="true" /></span>
          <div>
            <h2 id="dashboard-workspace-title" className="text-sm font-bold text-slate-900">No active workspace</h2>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">Create or join a workspace to unlock member, seat and security metrics.</p>
            <button type="button" onClick={onManage} className="mt-3 rounded-lg bg-indigo-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">View workspaces</button>
          </div>
        </div>
      </section>
    );
  }

  const utilization = organization.seatsPurchased ? Math.round((organization.seatsUsed / organization.seatsPurchased) * 100) : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="dashboard-workspace-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <img src={organization.logoUrl} alt="" className="h-11 w-11 rounded-xl border border-slate-200 object-cover" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="dashboard-workspace-title" className="truncate text-sm font-bold text-slate-900">{organization.name}</h2>
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700">{organization.plan}</span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">{organization.domain}</p>
          </div>
        </div>
        <button type="button" onClick={onManage} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">Manage workspace</button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Members</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{organization.members}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Seats</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{organization.seatsUsed}<span className="text-xs text-slate-400"> / {organization.seatsPurchased}</span></p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Domain</p>
          <p className={`mt-1 text-xs font-bold ${organization.domainVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
            {organization.domainVerified ? 'Verified' : 'Verification required'}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500"><span>Seat utilization</span><span>{utilization}%</span></div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`Seat utilization ${utilization}%`} role="progressbar" aria-valuenow={utilization} aria-valuemin="0" aria-valuemax="100">
          <div className={`h-full rounded-full transition-all ${utilization > 90 ? 'bg-amber-500' : 'bg-indigo-600'}`} style={{ width: `${utilization}%` }} />
        </div>
      </div>
    </section>
  );
};
