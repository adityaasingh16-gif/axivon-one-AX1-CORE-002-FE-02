import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield } from 'lucide-react';

export const AuthLayout = ({ children, title, subtitle }) => {
  const authTabs = [
    { label: 'Login', path: '/login' },
    { label: 'Register', path: '/register' },
    { label: 'Verify OTP', path: '/verify' },
    { label: 'Forgot Pass', path: '/forgot-password' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Brand Header */}
      <div className="flex items-center space-x-2.5 mb-6 cursor-pointer">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-xl text-slate-900 tracking-tight leading-none">Nexus<span className="text-indigo-600">Auth</span></span>
          <span className="text-[10px] text-slate-500 font-medium tracking-wide">Enterprise Suite</span>
        </div>
      </div>

      {/* Quick View Navigation Tabs */}
      <div className="mb-6 flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs">
        {authTabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      {/* White Clean Auth Card */}
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-slate-200/70">
        <div className="mb-6 text-center">
          {title && <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">{title}</h2>}
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>

        {children}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-slate-400 font-medium">
        Protected by NexusAuth Zero-Trust Architecture • All rights reserved
      </div>

    </div>
  );
};
