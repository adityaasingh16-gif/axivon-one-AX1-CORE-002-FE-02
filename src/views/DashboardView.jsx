import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, RefreshCw, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { dashboardApi } from '../services/mockDashboardApi';
import { DashboardKpiCard } from '../components/dashboard/DashboardKpiCard';
import { DashboardActivityWidget, DashboardSessionsWidget, DashboardWorkspaceWidget } from '../components/dashboard/DashboardWidgets';
import { DashboardSkeleton, DashboardState } from '../components/dashboard/DashboardState';

export const DashboardView = () => {
  const { user, isVerified } = useAuth();
  const { activeOrg } = useOrg();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setState('loading');
    setError('');
    try {
      const payload = await dashboardApi.getOverview({ user, organizationId: activeOrg?.id });
      setDashboard(payload);
      setState(payload?.kpis?.length ? 'success' : 'empty');
    } catch (err) {
      setDashboard(null);
      setError(err instanceof Error ? err.message : 'Unable to load dashboard data.');
      setState('error');
    }
  }, [activeOrg?.id, user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (state === 'loading') return <DashboardSkeleton />;
  if (state === 'error') {
    return <DashboardState type="error" title="Dashboard data could not be loaded" message={error} onRetry={loadDashboard} />;
  }
  if (state === 'empty' || !dashboard) {
    return <DashboardState title="No dashboard data available" message="There is no dashboard data for the current account or workspace yet." onRetry={loadDashboard} />;
  }

  return (
    <div className="space-y-6 pb-12 text-slate-900">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                {user?.role || 'User'} access
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${isVerified ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                {isVerified ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
                {isVerified ? 'Verified account' : 'Verification required'}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back, <span className="text-indigo-600">{user?.name || 'there'}</span>
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
              Monitor account security, workspace activity, sessions and key platform metrics from one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadDashboard}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Refresh
            </button>
            <Link to="/sessions" className="decent-btn-primary inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs">
              Manage sessions <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <section aria-labelledby="dashboard-kpi-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 id="dashboard-kpi-title" className="flex items-center gap-2 text-sm font-bold text-slate-900"><Shield className="h-4 w-4 text-indigo-600" aria-hidden="true" /> Platform overview</h2>
            <p className="mt-1 text-[11px] text-slate-500">Key indicators from the latest dashboard snapshot.</p>
          </div>
          <span className="hidden text-[10px] text-slate-400 sm:block">Updated {new Date(dashboard.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboard.kpis.map((metric) => <DashboardKpiCard key={metric.id} metric={metric} />)}
        </div>
      </section>

      {!isVerified && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div><p className="text-xs font-bold text-amber-900">Verify your email to improve account protection.</p><p className="mt-0.5 text-[11px] text-amber-800">Your dashboard is available, but some platform capabilities may remain restricted.</p></div>
          </div>
          <button type="button" onClick={() => navigate('/verify')} className="self-start rounded-lg border border-amber-300 bg-white px-3 py-2 text-[10px] font-bold text-amber-800 hover:bg-amber-100 sm:self-center">Verify now</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><DashboardActivityWidget activity={dashboard.activity || []} /></div>
        <DashboardSessionsWidget sessions={dashboard.sessions || []} onManage={() => navigate('/sessions')} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><DashboardWorkspaceWidget organization={dashboard.organization} onManage={() => navigate(dashboard.organization ? `/organizations/${dashboard.organization.id}` : '/organizations')} /></div>
        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-white p-2 text-indigo-600 shadow-sm"><Sparkles className="h-4 w-4" aria-hidden="true" /></span>
            <div><h2 className="text-sm font-bold text-slate-900">Quick actions</h2><p className="mt-1 text-[11px] leading-5 text-slate-500">Jump to the areas you use most.</p></div>
          </div>
          <div className="mt-4 grid gap-2">
            <Link to="/organizations" className="rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:text-indigo-700">Organizations</Link>
            <Link to="/settings/profile" className="rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:text-indigo-700">Profile settings</Link>
            <Link to="/settings/security" className="rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:text-indigo-700">Security settings</Link>
          </div>
        </section>
      </div>
    </div>
  );
};
