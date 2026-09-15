import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import { Shield, Monitor, LogOut, CheckCircle2, AlertTriangle, User, Building2, ChevronDown } from 'lucide-react';

export const Header = () => {
  const { user, isVerified, logout } = useAuth();
  const { activeOrg, organizations, switchActiveOrg } = useOrg();
  const navigate = useNavigate();

  const handleLogoutClick = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-white/10 bg-[#090d16]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Active Org Switcher */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">Nexus<span className="gradient-text">Auth</span></span>
                <span className="hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v2.4 Enterprise
                </span>
              </div>
            </div>
          </div>

          {/* Active Org Selector Dropdown */}
          {user && activeOrg && (
            <div className="hidden lg:flex items-center pl-3 border-l border-white/10">
              <div className="relative group">
                <button
                  onClick={() => navigate(`/organizations/${activeOrg.id}`)}
                  className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-200 transition-colors"
                >
                  <img
                    src={activeOrg.logoUrl}
                    alt={activeOrg.name}
                    className="w-4 h-4 rounded-md object-cover"
                  />
                  <span className="font-semibold text-white truncate max-w-[120px]">{activeOrg.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-transform" />
                </button>

                {/* Quick Org Dropdown */}
                {organizations.length > 1 && (
                  <div className="absolute left-0 mt-1 w-52 bg-[#0d1322] border border-white/10 rounded-xl shadow-2xl p-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                    <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Switch Workspace</div>
                    {organizations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => switchActiveOrg(org.id)}
                        className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          org.id === activeOrg.id ? 'bg-indigo-600/30 text-indigo-300 font-bold' : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <img src={org.logoUrl} alt={org.name} className="w-4 h-4 rounded object-cover" />
                        <span className="truncate">{org.name}</span>
                      </button>
                    ))}
                    <div className="pt-1 mt-1 border-t border-white/5">
                      <button
                        onClick={() => navigate('/organizations/new')}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        + Create Workspace
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Center Nav Navigation */}
        {user && (
          <nav className="hidden md:flex items-center space-x-1 glass-panel-subtle px-3 py-1.5 rounded-xl border border-white/5">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                  isActive
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`
              }
            >
              <User className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/organizations"
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                  isActive
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`
              }
            >
              <Building2 className="w-4 h-4" />
              <span>Organizations</span>
            </NavLink>

            <NavLink
              to="/sessions"
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                  isActive
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`
              }
            >
              <Monitor className="w-4 h-4" />
              <span>Active Sessions</span>
            </NavLink>
          </nav>
        )}

        {/* Right User Actions */}
        {user ? (
          <div className="flex items-center space-x-4">
            
            {/* Account Status Badge */}
            <div className="hidden sm:flex items-center space-x-2">
              {isVerified ? (
                <span className="flex items-center space-x-1.5 text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              ) : (
                <NavLink
                  to="/verify"
                  className="flex items-center space-x-1.5 text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30 font-medium transition-all animate-pulse"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Verify Email</span>
                </NavLink>
              )}
            </div>

            {/* Profile Brief */}
            <div className="flex items-center space-x-3 pl-2 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-inner">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <p className="font-semibold text-gray-200">{user.name}</p>
                <p className="text-gray-400 text-[10px]">{user.role}</p>
              </div>
              <button
                onClick={handleLogoutClick}
                title="Log Out"
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <NavLink
              to="/login"
              className="text-sm font-medium text-gray-300 hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign In
            </NavLink>
            <NavLink
              to="/register"
              className="gradient-btn text-white text-sm font-medium px-4 py-2 rounded-xl shadow-lg"
            >
              Create Account
            </NavLink>
          </div>
        )}

      </div>
    </header>
  );
};
