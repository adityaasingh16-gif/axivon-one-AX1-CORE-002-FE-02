import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import {
  Shield, Building2, Monitor, LogOut, CheckCircle2, AlertTriangle,
  ChevronDown, Plus, LayoutDashboard, Settings, Menu, X, Search, Sparkles, ChevronRight
} from 'lucide-react';

export const SidebarLayout = ({ children }) => {
  const { user, isVerified, logout } = useAuth();
  const { activeOrg, organizations, switchActiveOrg } = useOrg();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return [{ label: 'Overview', path: '/dashboard' }, { label: 'Dashboard' }];
    if (path === '/organizations') return [{ label: 'Workspaces', path: '/organizations' }, { label: 'All Organizations' }];
    if (path === '/organizations/new') return [{ label: 'Workspaces', path: '/organizations' }, { label: 'Setup New Organization' }];
    if (path.includes('/edit')) return [{ label: 'Workspaces', path: '/organizations' }, { label: activeOrg?.name || 'Workspace', path: `/organizations/${activeOrg?.id}` }, { label: 'Settings' }];
    if (path.startsWith('/organizations/')) return [{ label: 'Workspaces', path: '/organizations' }, { label: activeOrg?.name || 'Details' }];
    if (path === '/sessions') return [{ label: 'Account', path: '/dashboard' }, { label: 'Active Sessions' }];
    if (path === '/verify') return [{ label: 'Account', path: '/dashboard' }, { label: 'Email Verification' }];
    if (path.startsWith('/settings')) return [{ label: 'Account', path: '/dashboard' }, { label: 'Settings' }];
    return [{ label: 'App', path: '/dashboard' }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen w-60 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 shadow-sm ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 tracking-tight">Nexus<span className="text-indigo-600">Auth</span></span>
                <span className="block text-[10px] text-slate-500 font-medium">Enterprise Suite</span>
              </div>
            </div>

            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-500 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Workspace Switcher */}
          {user && (
            <div className="p-3 border-b border-slate-200">
              <div className="relative">
                <button
                  onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-left transition-colors"
                >
                  {activeOrg ? (
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <img src={activeOrg.logoUrl} alt={activeOrg.name} className="w-6 h-6 rounded-md object-cover shrink-0 border border-slate-200" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{activeOrg.name}</p>
                        <p className="text-[10px] text-indigo-600 font-mono truncate">/{activeOrg.slug}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-medium text-slate-700">Select Workspace</span>
                    </div>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOrgDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu */}
                {isOrgDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50">
                    <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-slate-400">Workspaces</div>
                    {organizations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => {
                          switchActiveOrg(org.id);
                          setIsOrgDropdownOpen(false);
                          navigate(`/organizations/${org.id}`);
                        }}
                        className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                          activeOrg?.id === org.id
                            ? 'bg-indigo-50 text-indigo-700 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <img src={org.logoUrl} alt={org.name} className="w-4 h-4 rounded object-cover border border-slate-200" />
                        <span className="truncate">{org.name}</span>
                      </button>
                    ))}
                    <div className="pt-1.5 mt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setIsOrgDropdownOpen(false);
                          navigate('/organizations/new');
                        }}
                        className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Workspace</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="p-3 space-y-5">
            <div>
              <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Main Menu
              </span>
              <div className="space-y-0.5">
                <NavLink
                  to="/dashboard"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>

                <NavLink
                  to="/organizations"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <Building2 className="w-4 h-4" />
                  <span>Organizations</span>
                </NavLink>
              </div>
            </div>

            {activeOrg && (
              <div>
                <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1.5 truncate">
                  {activeOrg.name}
                </span>
                <div className="space-y-0.5">
                  <NavLink
                    to={`/organizations/${activeOrg.id}`}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    end
                    className={({ isActive }) =>
                      `flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Workspace Hub</span>
                  </NavLink>

                  <NavLink
                    to={`/organizations/${activeOrg.id}/edit`}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings & Security</span>
                  </NavLink>
                </div>
              </div>
            )}

            <div>
              <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Security & Account
              </span>
              <div className="space-y-0.5">
                <NavLink
                  to="/settings/profile"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isActive || location.pathname.startsWith('/settings')
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <Settings className="w-4 h-4" />
                  <span>Account Settings</span>
                </NavLink>

                <NavLink
                  to="/sessions"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <Monitor className="w-4 h-4" />
                  <span>Active Sessions</span>
                </NavLink>

                {!isVerified && (
                  <NavLink
                    to="/verify"
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Verify Email</span>
                  </NavLink>
                )}
              </div>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer User Card */}
        {user && (
          <div className="p-3 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <p className="font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.role}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.label}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                  {crumb.path ? (
                    <span
                      onClick={() => navigate(crumb.path)}
                      className="hover:text-indigo-600 cursor-pointer transition-colors"
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <span className="font-bold text-slate-900">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div
              onClick={() => navigate('/organizations')}
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-pointer hover:border-indigo-600 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search workspaces...</span>
            </div>

            {isVerified ? (
              <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified</span>
              </span>
            ) : (
              <button
                onClick={() => navigate('/verify')}
                className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200"
              >
                Verify Email
              </button>
            )}
          </div>

        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>

      </div>

    </div>
  );
};
