import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockAuthApi } from '../services/mockAuthApi';
import { Monitor, Smartphone, Globe, ShieldAlert, Trash2, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

export const SessionManagementView = () => {
  const { user, token, showToast } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const list = await mockAuthApi.getActiveSessions({ userId: user.id, currentToken: token });
      setSessions(list);
    } catch (err) {
      showToast('Failed to load active sessions.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, token, showToast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSingle = async (sessionId, isCurrent) => {
    if (isCurrent) {
      if (!window.confirm('Revoking your current session will log you out immediately. Proceed?')) return;
    }

    try {
      await mockAuthApi.revokeSession({ sessionId });
      showToast('Session terminated.', 'info');
      fetchSessions();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!window.confirm('Are you sure you want to log out all other devices except this one?')) return;

    try {
      setIsRevokingAll(true);
      const res = await mockAuthApi.revokeAllOtherSessions({ userId: user.id, currentToken: token });
      showToast(res.message, 'success', 'Sessions Cleared');
      fetchSessions();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsRevokingAll(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/10">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
            <Monitor className="w-6 h-6 text-indigo-400" />
            <span>Active Connected Sessions</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your logged-in browser devices and revoke unauthorized session tokens.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchSessions}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-medium transition-all"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {sessions.length > 1 && (
            <button
              onClick={handleRevokeAllOthers}
              disabled={isRevokingAll}
              className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-semibold transition-all flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Revoke All Other Sessions</span>
            </button>
          )}
        </div>
      </div>

      {/* Sessions Grid / Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden p-6 space-y-4">
        <h3 className="font-semibold text-gray-200 text-sm flex items-center justify-between">
          <span>Active Device List ({sessions.length})</span>
          <span className="text-xs text-gray-400 font-normal">Encrypted TLS 1.3 Sessions</span>
        </h3>

        {isLoading ? (
          <div className="py-12 text-center text-gray-400 space-y-2">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
            <p className="text-xs">Fetching active device tokens...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-gray-400 space-y-2">
            <AlertCircle className="w-8 h-8 text-gray-500 mx-auto" />
            <p className="text-sm">No active sessions found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  sess.isCurrent
                    ? 'bg-indigo-950/40 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                }`}
              >
                
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${sess.isCurrent ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-gray-400'}`}>
                    <Monitor className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-gray-200 text-sm">{sess.deviceName}</h4>
                      {sess.isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>This Device (Current)</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Globe className="w-3.5 h-3.5 text-gray-500" />
                        <span>{sess.ipAddress}</span>
                      </span>
                      <span>•</span>
                      <span>Location: {sess.location}</span>
                      <span>•</span>
                      <span>Expires: {new Date(sess.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end shrink-0">
                  <button
                    onClick={() => handleRevokeSingle(sess.id, sess.isCurrent)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 text-xs font-medium transition-all flex items-center space-x-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{sess.isCurrent ? 'Log Out Device' : 'Revoke Token'}</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
