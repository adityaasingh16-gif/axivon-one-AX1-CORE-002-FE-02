import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { Shield, Monitor, Key, CheckCircle2, AlertTriangle, Activity, Building2, Plus, ArrowRight } from 'lucide-react';

export const DashboardView = () => {
  const { user, session, isVerified, devToolsAction } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-12 text-slate-900">
      
      {/* Welcome Banner Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {user?.role || 'User'} Access Portal
              </span>
              {isVerified ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Unverified Account</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, <span className="text-indigo-600">{user?.name}</span>!
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-xl">
              Your active session token is validated. You can view session metadata, manage connected devices, or configure workspace settings.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to="/sessions"
              className="decent-btn-primary text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-xs"
            >
              <Monitor className="w-4 h-4" />
              <span>Manage Active Devices</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Security Health & Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Security Score Widget */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Security Rating</span>
            </h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {isVerified ? '94/100 Excellent' : '65/100 Unverified'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${isVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: isVerified ? '94%' : '65%' }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {isVerified
                ? 'Your password complexity, active token encryption, and verified email pass security checks.'
                : 'Please verify your email address to unlock full platform capabilities.'}
            </p>
          </div>

          {!isVerified && (
            <button
              onClick={() => navigate('/verify')}
              className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Verify Email Address Now</span>
            </button>
          )}
        </div>

        {/* Current Active Session Widget */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Monitor className="w-4 h-4 text-indigo-600" />
            <span>Active Session Token</span>
          </h3>

          <div className="space-y-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Device:</span>
              <span className="font-semibold text-slate-900 font-sans">{session?.deviceName || 'Current Browser'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">IP Addr:</span>
              <span className="text-indigo-600">{session?.ipAddress || '127.0.0.1'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Token ID:</span>
              <span className="text-slate-700 truncate max-w-[120px]">{session?.token ? `${session.token.substring(0, 12)}...` : 'None'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Auto-Timeout: 10m idle</span>
            <button
              onClick={devToolsAction.triggerInactivityWarning}
              className="text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              Test Idle Alert
            </button>
          </div>
        </div>

        {/* Account Info Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Key className="w-4 h-4 text-indigo-600" />
            <span>Profile Identity</span>
          </h3>

          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Name:</span>
              <span className="font-bold text-slate-900">{user?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Email:</span>
              <span className="font-mono text-slate-900">{user?.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Role:</span>
              <span className="font-semibold text-indigo-600">{user?.role}</span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-end">
            <span className="text-[10px] text-slate-400">Registered: {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>

      </div>

      {/* Security Activity Audit Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>Recent Account Audit Logs</span>
          </h3>
          <span className="text-xs text-slate-400">Real-time event stream</span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
            <div className="flex-1 flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-900">Successful Session Authentication</p>
                <p className="text-slate-500 text-[11px]">Validated session token via mock auth API engine.</p>
              </div>
              <span className="text-slate-400 text-[11px]">Just now</span>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
            <div className="flex-1 flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-900">Device Location Registered</p>
                <p className="text-slate-500 text-[11px]">Originating IP: 127.0.0.1 (Local Environment)</p>
              </div>
              <span className="text-slate-400 text-[11px]">2 mins ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Workspaces Dashboard Banner */}
      <DashboardOrgSection />

    </div>
  );
};

const DashboardOrgSection = () => {
  const { activeOrg, organizations } = useOrg();
  const navigate = useNavigate();

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Organization Workspaces & Multi-Tenancy</h3>
            <p className="text-xs text-slate-500">Manage enterprise workspace access, team roles, and security policies.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/organizations/new')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Organization</span>
          </button>
          <button
            onClick={() => navigate('/organizations')}
            className="decent-btn-primary text-xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center space-x-1.5"
          >
            <span>View All ({organizations.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Org Highlight Card */}
      {activeOrg && (
        <div className="p-4 bg-slate-50 rounded-xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <img src={activeOrg.logoUrl} alt={activeOrg.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-sm">{activeOrg.name}</span>
                <span className="text-[10px] font-mono text-indigo-600">/{activeOrg.slug}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200">
                  {activeOrg.plan}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeOrg.members.length} team members • {activeOrg.billing.seatsUsed}/{activeOrg.billing.seatsPurchased} seats used • Domain: {activeOrg.primaryDomain}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-center">
            <button
              onClick={() => navigate(`/organizations/${activeOrg.id}`)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold transition-colors flex items-center space-x-1 shadow-xs"
            >
              <span>Manage Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
