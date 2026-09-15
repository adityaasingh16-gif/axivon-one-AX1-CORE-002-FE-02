import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Clock, LogOut, RefreshCw } from 'lucide-react';

export const InactivityModal = () => {
  const { isIdleWarningOpen, idleCountdown, stayLoggedIn, logout } = useAuth();

  if (!isIdleWarningOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass-panel p-6 sm:p-8 rounded-2xl max-w-md w-full border border-amber-500/30 shadow-2xl text-center space-y-6">
        
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">Session Inactivity Timeout</h3>
          <p className="text-sm text-gray-300">
            You have been inactive for a while. For security reasons, your session will be locked automatically.
          </p>
        </div>

        {/* Countdown display */}
        <div className="py-4 px-6 bg-slate-900/80 rounded-xl border border-white/10 flex items-center justify-center space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span className="text-xs text-gray-400">Logging out in</span>
          <span className="text-2xl font-mono font-bold text-amber-400">{idleCountdown}s</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={stayLoggedIn}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl gradient-btn text-white font-medium text-sm shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Keep Me Logged In</span>
          </button>

          <button
            onClick={() => logout('Manual logout during inactivity prompt.')}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-300 hover:text-red-400 border border-white/10 hover:border-red-500/30 text-sm font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Now</span>
          </button>
        </div>

      </div>
    </div>
  );
};
