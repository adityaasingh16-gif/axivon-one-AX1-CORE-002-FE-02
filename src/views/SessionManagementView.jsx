import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/authApi';
import { Monitor, Globe, Trash2, RefreshCw, AlertCircle } from 'lucide-react';

export const SessionManagementView = () => {
  const { user, token, showToast } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      setSessions(await authApi.listSessions(token));
    } catch (err) {
      showToast(err.message || 'Failed to load active sessions.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleRevokeSingle = async (sessionId, isCurrent) => {
    if (isCurrent && !window.confirm('Revoking your current session will sign you out. Proceed?')) return;
    try {
      await authApi.revokeSession(token, sessionId);
      showToast(isCurrent ? 'Current session signed out.' : 'Session revoked.', 'success');
      if (isCurrent) window.location.href = '/login';
      else fetchSessions();
    } catch (err) {
      showToast(err.message || 'Unable to revoke session.', 'error');
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm('Sign out all active sessions?')) return;
    try {
      setIsRevokingAll(true);
      const result = await authApi.revokeAllSessions(token);
      showToast(result?.message || 'All sessions signed out.', 'success', 'Sessions Cleared');
      window.location.href = '/login';
    } catch (err) {
      showToast(err.message || 'Unable to revoke sessions.', 'error');
    } finally {
      setIsRevokingAll(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
            <Monitor className="w-6 h-6 text-indigo-400" />
            <span>Active Connected Sessions</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage your authenticated sessions and revoke unauthorized devices.</p>
          {user?.email && <p className="text-xs text-gray-500 mt-1">{user.email}</p>}
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={fetchSessions} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-medium" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {sessions.length > 0 && (
            <button onClick={handleRevokeAll} disabled={isRevokingAll} className="px-4 py-2.5 rounded-xl bg-red-500/15 text-red-300 border border-red-500/30 text-xs font-semibold disabled:opacity-50">
              {isRevokingAll ? 'Signing out…' : 'Sign Out All Sessions'}
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden p-6 space-y-4">
        <h3 className="font-semibold text-gray-200 text-sm flex items-center justify-between">
          <span>Active Device List ({sessions.length})</span>
          <span className="text-xs text-gray-400 font-normal">Backend session state</span>
        </h3>

        {isLoading ? (
          <div className="py-12 text-center text-gray-400"><RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-2" /><p className="text-xs">Fetching active sessions…</p></div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-gray-400"><AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" /><p className="text-sm">No active sessions found.</p></div>
        ) : (
          <div className="space-y-3">
            {sessions.map(sess => (
              <div key={sess.id} className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${sess.isCurrent ? 'bg-indigo-950/40 border-indigo-500/40' : 'bg-white/5 border-white/5'}`}>
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${sess.isCurrent ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-gray-400'}`}><Monitor className="w-6 h-6" /></div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-gray-200 text-sm">{sess.deviceType || sess.deviceName || 'Web Session'}</h4>
                      {sess.isCurrent && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Current</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span className="flex items-center space-x-1"><Globe className="w-3.5 h-3.5 text-gray-500" /><span>{sess.ipAddress || '—'}</span></span>
                      <span>Created: {sess.createdAt ? new Date(sess.createdAt).toLocaleString() : '—'}</span>
                      <span>Expires: {sess.expiresAt ? new Date(sess.expiresAt).toLocaleString() : '—'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleRevokeSingle(sess.id, sess.isCurrent)} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium flex items-center space-x-1.5">
                  <Trash2 className="w-3.5 h-3.5" /><span>{sess.isCurrent ? 'Sign Out' : 'Revoke'}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
