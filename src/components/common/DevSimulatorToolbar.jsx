import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockAuthApi } from '../../services/mockAuthApi';
import { Wrench, ChevronUp, ChevronDown, UserCheck, ShieldOff, Clock, Database, Key, CheckCircle, XCircle } from 'lucide-react';

export const DevSimulatorToolbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, token, isVerified, login, devToolsAction, showToast } = useAuth();

  const handleQuickLoginAdmin = async () => {
    try {
      await login({ email: 'alex@example.com', password: 'Password123!', rememberMe: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickLoginUnverified = async () => {
    try {
      await login({ email: 'jordan@example.com', password: 'Password123!', rememberMe: false });
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDb = () => {
    if (window.confirm('Reset local mock database to initial seed data?')) {
      mockAuthApi.devTools.resetDatabase();
      devToolsAction.reloadUserSession();
      showToast('Database reset to initial demo seeds.', 'info', 'Mock DB Reset');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c121e]/95 border-t border-indigo-500/30 backdrop-blur-lg shadow-2xl text-xs font-sans">
      
      {/* Header bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors text-gray-300"
      >
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-indigo-300 flex items-center space-x-1.5">
            <Wrench className="w-3.5 h-3.5" />
            <span>Interactive State & Session Dev Simulator</span>
          </span>
          <span className="hidden sm:inline-block text-gray-500">|</span>
          <span className="hidden sm:inline-block text-gray-400 text-[11px]">
            User: {user ? `${user.name} (${user.role})` : 'Guest'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
            Dev Tools Active
          </span>
          {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Expanded Controls Panel */}
      {isOpen && (
        <div className="p-4 border-t border-white/10 bg-[#090d16] grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Quick Presets */}
          <div className="space-y-2 glass-panel-subtle p-3 rounded-xl">
            <h4 className="font-semibold text-gray-200 flex items-center space-x-1.5 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Quick Login Presets</span>
            </h4>
            <div className="flex flex-col space-y-1.5">
              <button
                onClick={handleQuickLoginAdmin}
                className="w-full text-left px-2.5 py-1.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-all text-xs font-medium flex items-center justify-between"
              >
                <span>Login as Verified Admin</span>
                <span className="text-[10px] text-indigo-400/70">alex@example.com</span>
              </button>

              <button
                onClick={handleQuickLoginUnverified}
                className="w-full text-left px-2.5 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-all text-xs font-medium flex items-center justify-between"
              >
                <span>Login as Unverified User</span>
                <span className="text-[10px] text-amber-400/70">jordan@example.com</span>
              </button>
            </div>
          </div>

          {/* Session Overrides */}
          <div className="space-y-2 glass-panel-subtle p-3 rounded-xl">
            <h4 className="font-semibold text-gray-200 flex items-center space-x-1.5 text-xs">
              <Key className="w-3.5 h-3.5 text-purple-400" />
              <span>Session & State Triggers</span>
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={devToolsAction.expireCurrentSession}
                className="px-2.5 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 transition-all text-xs font-medium flex items-center space-x-1"
              >
                <ShieldOff className="w-3 h-3" />
                <span>Expire Token</span>
              </button>

              <button
                onClick={devToolsAction.toggleCurrentVerification}
                disabled={!user}
                className="px-2.5 py-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 disabled:opacity-40 transition-all text-xs font-medium flex items-center space-x-1"
              >
                {isVerified ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                <span>{isVerified ? 'Unverify User' : 'Verify User'}</span>
              </button>

              <button
                onClick={devToolsAction.triggerInactivityWarning}
                disabled={!user}
                className="px-2.5 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 disabled:opacity-40 transition-all text-xs font-medium flex items-center space-x-1"
              >
                <Clock className="w-3 h-3" />
                <span>Trigger Idle</span>
              </button>

              <button
                onClick={handleResetDb}
                className="px-2.5 py-1.5 rounded bg-gray-500/10 hover:bg-gray-500/20 text-gray-300 border border-gray-500/20 transition-all text-xs font-medium flex items-center space-x-1"
              >
                <Database className="w-3 h-3" />
                <span>Reset Seed DB</span>
              </button>
            </div>
          </div>

          {/* Active State Debug Inspector */}
          <div className="space-y-2 glass-panel-subtle p-3 rounded-xl text-gray-400">
            <h4 className="font-semibold text-gray-200 flex items-center space-x-1.5 text-xs">
              <span>State Inspector</span>
            </h4>
            <div className="font-mono text-[10px] space-y-1 bg-black/40 p-2 rounded border border-white/5 overflow-x-auto">
              <p><span className="text-gray-500">Auth Status:</span> {user ? <span className="text-emerald-400 font-semibold">AUTHENTICATED</span> : <span className="text-amber-400">GUEST</span>}</p>
              <p><span className="text-gray-500">Is Verified:</span> {isVerified ? 'true' : 'false'}</p>
              <p><span className="text-gray-500">Token:</span> {token ? `${token.substring(0, 18)}...` : 'null'}</p>
              <p><span className="text-gray-500">Universal Test Code:</span> <span className="text-indigo-400 font-bold">123456</span></p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
