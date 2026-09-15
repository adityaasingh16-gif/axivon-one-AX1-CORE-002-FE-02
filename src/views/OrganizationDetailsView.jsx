import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { mockOrgApi } from '../services/mockOrgApi';
import {
  Building2, Users, CreditCard, Settings, UserPlus, Edit3, CheckCircle2,
  Globe, Clock, Search, Sparkles, Download, ArrowLeft,
  ShieldCheck, FileText, Check
} from 'lucide-react';
import { InviteMemberModal } from '../components/organization/InviteMemberModal';
import { EditMemberRoleModal } from '../components/organization/EditMemberRoleModal';

export const OrganizationDetailsView = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const { activeOrg, switchActiveOrg, showToast } = useOrg();

  const [org, setOrg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Search & Filters for Members Tab
  const [memberSearch, setMemberSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Minimalist Compact Layout Mode Toggle
  const [isCompactMode, setIsCompactMode] = useState(false);

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedMemberToEdit, setSelectedMemberToEdit] = useState(null);

  const fetchOrgDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await mockOrgApi.getOrganization(orgId);
      setOrg(data);
    } catch (err) {
      console.error('Failed to load org details:', err);
      showToast(err.message || 'Organization not found.', 'error');
      navigate('/organizations');
    } finally {
      setIsLoading(false);
    }
  }, [orgId, navigate, showToast]);

  useEffect(() => {
    fetchOrgDetails();
  }, [fetchOrgDetails]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 text-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading organization workspace details...</p>
        </div>
      </div>
    );
  }

  if (!org) return null;

  const isActiveWorkspace = activeOrg?.id === org.id;

  // Filter members list
  const filteredMembers = org.members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                          m.email.toLowerCase().includes(memberSearch.toLowerCase());
    const matchesRole = roleFilter === 'All' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className={`min-h-[calc(100vh-4rem)] max-w-7xl mx-auto text-slate-900 transition-all space-y-6 ${isCompactMode ? 'text-xs' : ''}`}>
      
      {/* Top Bar with Back Link & View Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          onClick={() => navigate('/organizations')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center space-x-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Organizations</span>
        </button>

        {/* Layout Mode Toggle */}
        <button
          onClick={() => setIsCompactMode(!isCompactMode)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
            isCompactMode
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isCompactMode ? 'Minimalist View: ON' : 'Switch to Minimalist View'}</span>
        </button>
      </div>

      {/* Header Card (Standard vs Compact) */}
      {isCompactMode ? (
        /* MINIMALIST COMPACT HEADER */
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <img
              src={org.logoUrl}
              alt={org.name}
              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">{org.name}</h1>
                <span className="text-[10px] font-mono text-indigo-600">/{org.slug}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                  {org.plan}
                </span>
                {org.isDomainVerified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" title="Domain Verified" />
                )}
              </div>
              <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-0.5">
                <span>{org.members.length} members</span>
                <span>•</span>
                <span>{org.billing.seatsUsed}/{org.billing.seatsPurchased} seats</span>
                <span>•</span>
                <span className="font-mono">{org.primaryDomain}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isActiveWorkspace && (
              <button
                onClick={() => switchActiveOrg(org.id)}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100"
              >
                Switch Workspace
              </button>
            )}
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="decent-btn-primary text-xs font-medium px-3.5 py-1.5 rounded-lg shadow-xs"
            >
              + Invite
            </button>
            <button
              onClick={() => navigate(`/organizations/${org.id}/edit`)}
              className="px-3 py-1.5 rounded-lg bg-white text-slate-700 border border-slate-200 text-xs hover:bg-slate-50"
            >
              Edit
            </button>
          </div>
        </div>
      ) : (
        /* STANDARD HEADER */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            
            <div className="flex items-start sm:items-center space-x-4">
              <img
                src={org.logoUrl}
                alt={org.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{org.name}</h1>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider bg-indigo-50 text-indigo-700 border-indigo-200">
                    {org.plan}
                  </span>
                  {org.isDomainVerified && (
                    <span className="flex items-center space-x-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Domain Verified</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="font-mono text-indigo-600 font-semibold">/{org.slug}</span>
                  <span>•</span>
                  <span>{org.industry}</span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{org.primaryDomain}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {!isActiveWorkspace && (
                <button
                  onClick={() => switchActiveOrg(org.id)}
                  className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold transition-all flex items-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Switch to Workspace</span>
                </button>
              )}

              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="decent-btn-primary text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Member</span>
              </button>

              <button
                onClick={() => navigate(`/organizations/${org.id}/edit`)}
                className="px-4 py-2.5 rounded-xl bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-xs font-semibold transition-colors flex items-center space-x-1.5"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Settings</span>
              </button>
            </div>

          </div>

          {/* Stats Grid */}
          <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">Total Team Members</span>
              <div className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>{org.members.length} Users</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">License Seat Allocation</span>
              <div className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span>{org.billing.seatsUsed} / {org.billing.seatsPurchased} Seats</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">Security Policy</span>
              <div className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className={`w-5 h-5 ${org.mfaRequired ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span className="text-sm font-semibold">{org.mfaRequired ? 'MFA Mandated' : 'Optional MFA'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">Primary Domain</span>
              <div className="text-sm font-bold text-slate-900 font-mono flex items-center space-x-1.5 truncate">
                <Globe className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="truncate">{org.primaryDomain}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-px overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Building2 },
          { id: 'members', label: `Members (${org.members.length})`, icon: Users },
          { id: 'settings', label: 'Settings & Security', icon: Settings },
          { id: 'billing', label: 'Billing & Plan', icon: CreditCard }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 rounded-t-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* Organization Info Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Organization Summary</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">Company Size</span>
                  <span className="text-slate-900 font-semibold">{org.companySize}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">Created Date</span>
                  <span className="text-slate-900 font-semibold">{new Date(org.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">Support Email</span>
                  <span className="text-slate-900 font-mono">{org.supportEmail || 'None specified'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">Billing Email</span>
                  <span className="text-slate-900 font-mono">{org.billingEmail || 'None specified'}</span>
                </div>
              </div>
            </div>

            {/* Audit Log Activity Feed */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Recent Workspace Activity Log</span>
              </h3>

              <div className="space-y-3">
                {org.activityLog && org.activityLog.map((act) => (
                  <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      <div>
                        <p className="text-slate-900 font-medium">{act.action}</p>
                        <p className="text-slate-500 text-[11px]">Triggered by <span className="text-slate-700 font-medium">{act.user}</span></p>
                      </div>
                    </div>
                    <span className="text-slate-400 text-[11px] font-mono">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Security Posture */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Security Posture</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500">MFA Policy:</span>
                  {org.mfaRequired ? (
                    <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Enforced</span>
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold">Optional</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500">Domain Whitelist:</span>
                  <span className="text-slate-900 font-mono font-semibold">{org.allowedDomains?.length || 1} domains</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500">Domain Verification:</span>
                  {org.isDomainVerified ? (
                    <span className="text-emerald-700 font-semibold">Verified</span>
                  ) : (
                    <span className="text-amber-700 font-semibold">Unverified</span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: Members & Roles */}
      {activeTab === 'members' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search member by name or email..."
                className="w-full decent-input pl-9 text-xs"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-medium">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="decent-input py-1.5 text-xs"
              >
                <option value="All">All Roles</option>
                <option value="Owner">Owner</option>
                <option value="Admin">Admin</option>
                <option value="Member">Member</option>
                <option value="Billing">Billing</option>
              </select>

              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="decent-btn-primary text-xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 ml-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Member</span>
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Member</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Joined Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs shrink-0">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{m.name}</p>
                          <p className="text-slate-500 font-mono text-[11px]">{m.email}</p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200">
                          {m.role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {m.status === 'Active' ? (
                          <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-amber-700 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>Invited</span>
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-500 font-mono">
                        {new Date(m.joinedAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedMemberToEdit(m)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-xs font-semibold transition-colors"
                        >
                          Edit Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: Settings & Security */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Workspace Settings & Security Policies</h3>
              <p className="text-xs text-slate-500">Configure organization identity, domain restriction, and authentication standards.</p>
            </div>
            <button
              onClick={() => navigate(`/organizations/${org.id}/edit`)}
              className="decent-btn-primary text-xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center space-x-1.5"
            >
              <Edit3 className="w-4 h-4" />
              <span>Full Edit Form</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs text-slate-500 uppercase font-semibold">Primary Domain</span>
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono text-slate-900">{org.primaryDomain}</span>
                {org.isDomainVerified ? (
                  <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">Verified</span>
                ) : (
                  <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">Pending Verification</span>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs text-slate-500 uppercase font-semibold">MFA Policy</span>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-900 font-semibold">{org.mfaRequired ? 'Mandatory for All Members' : 'Optional / User-Defined'}</span>
                <span className="text-xs text-indigo-600 font-mono">Enforced</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Billing & Plan */}
      {activeTab === 'billing' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Plan Summary Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Active Subscription</span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{org.plan} Tier</h3>
              <p className="text-xs text-slate-500 mt-1">Renewal Date: <span className="text-slate-800 font-mono font-semibold">{org.billing?.renewalDate}</span> ({org.billing?.billingCycle})</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Seats Allocation</span>
                <span className="text-lg font-bold text-slate-900">{org.billing?.seatsUsed} / {org.billing?.seatsPurchased} Seats Used</span>
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Billing Invoice History</span>
            </h3>

            <div className="space-y-3">
              {org.billing?.invoices && org.billing.invoices.map((inv) => (
                <div key={inv.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-4">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <span className="font-bold text-slate-900 font-mono">{inv.id}</span>
                      <span className="text-slate-500 block text-[11px]">{inv.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <span className="font-bold text-slate-900">{inv.amount}</span>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">{inv.status}</span>
                    <button className="text-slate-400 hover:text-slate-900 p-1 rounded transition-colors" title="Download PDF Invoice">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Modals */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        orgId={org.id}
      />

      <EditMemberRoleModal
        isOpen={!!selectedMemberToEdit}
        onClose={() => setSelectedMemberToEdit(null)}
        member={selectedMemberToEdit}
        orgId={org.id}
      />

    </div>
  );
};
