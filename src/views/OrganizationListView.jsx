import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { Building2, Plus, Users, ShieldCheck, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export const OrganizationListView = () => {
  const { organizations, activeOrg, switchActiveOrg, isLoadingOrgs } = useOrg();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 text-[#f8fafc]">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1c2436]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Workspaces & Organizations
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Manage your organization memberships, team roles, and security policies.
          </p>
        </div>

        <button
          onClick={() => navigate('/organizations/new')}
          className="decent-btn-primary text-xs font-semibold flex items-center space-x-1.5 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>New Organization</span>
        </button>
      </div>

      {/* Content Grid */}
      {isLoadingOrgs ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#94a3b8]">Loading organizations...</p>
        </div>
      ) : organizations.length === 0 ? (
        <div className="py-12 text-center decent-card max-w-lg mx-auto p-6">
          <div className="w-12 h-12 rounded-xl bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center text-[#3b82f6] mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No Workspaces Found</h3>
          <p className="text-xs text-[#94a3b8] mb-4">
            You are not a member of any organization workspace yet.
          </p>
          <button
            onClick={() => navigate('/organizations/new')}
            className="decent-btn-primary text-xs font-semibold mx-auto flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Setup First Organization</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {organizations.map((org) => {
            const isActive = activeOrg?.id === org.id;

            return (
              <div
                key={org.id}
                className={`decent-card p-5 flex flex-col justify-between transition-all ${
                  isActive
                    ? 'border-[#2563eb] bg-[#151b2c]'
                    : 'hover:border-[#334155]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={org.logoUrl}
                        alt={org.name}
                        className="w-10 h-10 rounded-lg object-cover border border-[#202a3f]"
                      />
                      <div>
                        <h2 className="font-bold text-base text-white flex items-center space-x-1.5">
                          <span>{org.name}</span>
                          {org.isDomainVerified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" title="Verified Domain" />
                          )}
                        </h2>
                        <span className="text-xs text-[#94a3b8] font-mono">/{org.slug}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#202a3f] text-[#94a3b8] uppercase tracking-wider">
                      {org.plan}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-[#94a3b8] mb-5">
                    <div className="flex justify-between">
                      <span>Industry:</span>
                      <span className="text-gray-200 font-medium">{org.industry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Domain:</span>
                      <span className="text-gray-200 font-mono">{org.primaryDomain}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Members:</span>
                      <span className="flex items-center space-x-1 text-gray-200 font-medium">
                        <Users className="w-3.5 h-3.5 text-[#3b82f6]" />
                        <span>{org.members.length} Users</span>
                      </span>
                    </div>
                    {org.mfaRequired && (
                      <div className="flex items-center space-x-1 text-emerald-400 pt-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>MFA Enforced</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#202a3f] flex items-center justify-between">
                  {isActive ? (
                    <span className="text-xs font-medium text-emerald-400 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Active Workspace</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => switchActiveOrg(org.id)}
                      className="text-xs font-medium px-2.5 py-1 rounded bg-[#1a2238] hover:bg-[#202a3f] text-gray-300 border border-[#202a3f] transition-colors"
                    >
                      Switch Here
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/organizations/${org.id}`)}
                    className="text-xs font-medium text-[#3b82f6] hover:text-[#60a5fa] flex items-center space-x-1"
                  >
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
