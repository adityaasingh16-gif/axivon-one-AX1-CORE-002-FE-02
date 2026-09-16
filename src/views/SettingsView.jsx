import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  UserRound, Building2, ShieldCheck, SlidersHorizontal, Save, CheckCircle2,
  AlertCircle, Loader2, LockKeyhole, Bell, MonitorCog, Globe2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';

const SETTINGS_KEY = 'auth_suite_system_settings';
const SECURITY_KEY = 'auth_suite_security_settings';

const DEFAULT_SYSTEM = {
  timezone: 'Asia/Kolkata',
  language: 'English',
  emailNotifications: true,
  compactMode: false,
  maintenanceMode: false,
};

const getSystemSettings = () => {
  try {
    return { ...DEFAULT_SYSTEM, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return DEFAULT_SYSTEM;
  }
};

const saveSystemSettings = (settings) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
const getSecuritySettings = (user) => {
  try {
    return { mfaEnabled: !!user?.mfaEnabled, loginAlerts: true, sessionTimeout: 30, ...JSON.parse(localStorage.getItem(SECURITY_KEY) || '{}') };
  } catch {
    return { mfaEnabled: !!user?.mfaEnabled, loginAlerts: true, sessionTimeout: 30 };
  }
};
const saveSecuritySettings = (settings) => localStorage.setItem(SECURITY_KEY, JSON.stringify(settings));

const sections = [
  { id: 'profile', label: 'Profile', description: 'Personal account details', icon: UserRound },
  { id: 'organization', label: 'Organization', description: 'Workspace identity and defaults', icon: Building2 },
  { id: 'security', label: 'Security', description: 'Authentication and session protection', icon: ShieldCheck },
  { id: 'system', label: 'System', description: 'Application preferences', icon: SlidersHorizontal },
];

const getSection = (pathname) => sections.find(section => pathname === `/settings/${section.id}`)?.id || 'profile';

const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
  </label>
);

const Input = ({ className = '', ...props }) => (
  <input {...props} className={`w-full decent-input text-sm ${className}`} />
);

const Toggle = ({ checked, onChange, label, description, icon: Icon }) => (
  <label className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer hover:bg-slate-50 transition-colors">
    <span className="flex items-start gap-3 min-w-0">
      {Icon && <Icon className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />}
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {description && <span className="block text-xs text-slate-500 mt-0.5">{description}</span>}
      </span>
    </span>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
    <span className="relative w-10 h-5 rounded-full bg-slate-300 peer-checked:bg-indigo-600 transition-colors shrink-0 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
  </label>
);

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </div>
  </div>
);

export const SettingsView = () => {
  const { user, updateUserProfile, updateUserSecurity, showToast } = useAuth();
  const { activeOrg, updateOrg } = useOrg();
  const location = useLocation();
  const activeSection = getSection(location.pathname);

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [organization, setOrganization] = useState({
    name: activeOrg?.name || '', slug: activeOrg?.slug || '', logoUrl: activeOrg?.logoUrl || '',
    primaryDomain: activeOrg?.primaryDomain || '', industry: activeOrg?.industry || '',
    companySize: activeOrg?.companySize || '', supportEmail: activeOrg?.supportEmail || '',
    billingEmail: activeOrg?.billingEmail || '', mfaRequired: !!activeOrg?.mfaRequired
  });
  const [security, setSecurity] = useState(() => getSecuritySettings(user));
  const [system, setSystem] = useState(getSystemSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => setProfile({ name: user?.name || '', email: user?.email || '' }), [user]);
  useEffect(() => setSecurity(getSecuritySettings(user)), [user]);
  useEffect(() => {
    if (!activeOrg) return;
    setOrganization(prev => ({ ...prev, name: activeOrg.name || '', slug: activeOrg.slug || '', logoUrl: activeOrg.logoUrl || '', primaryDomain: activeOrg.primaryDomain || '', industry: activeOrg.industry || '', companySize: activeOrg.companySize || '', supportEmail: activeOrg.supportEmail || '', billingEmail: activeOrg.billingEmail || '', mfaRequired: !!activeOrg.mfaRequired }));
  }, [activeOrg]);

  const sectionMeta = useMemo(() => sections.find(item => item.id === activeSection) || sections[0], [activeSection]);

  const validate = () => {
    if (activeSection === 'profile') {
      if (!profile.name.trim()) return 'Full name is required.';
      if (!/^\S+@\S+\.\S+$/.test(profile.email.trim())) return 'Enter a valid email address.';
    }
    if (activeSection === 'organization') {
      if (!organization.name.trim()) return 'Organization name is required.';
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(organization.slug)) return 'Slug may contain lowercase letters, numbers and hyphens only.';
    }
    if (activeSection === 'security' && (security.sessionTimeout < 5 || security.sessionTimeout > 1440)) return 'Session timeout must be between 5 and 1440 minutes.';
    return '';
  };

  const handleSave = async e => {
    e.preventDefault();
    const validationError = validate();
    setError(validationError); setSaved(false);
    if (validationError) return;
    setIsSaving(true);
    try {
      if (activeSection === 'profile') await updateUserProfile(profile);
      if (activeSection === 'organization') await updateOrg(activeOrg.id, organization);
      if (activeSection === 'security') { await updateUserSecurity({ mfaEnabled: security.mfaEnabled }); saveSecuritySettings(security); }
      if (activeSection === 'system') { saveSystemSettings(system); showToast('System preferences saved successfully.', 'success', 'Settings Saved'); }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Unable to save changes.');
    } finally { setIsSaving(false); }
  };

  const renderProfile = () => (
    <>
      <SectionHeader icon={UserRound} title="Profile settings" description="Keep your personal account information current." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
        <Field label="Full name"><Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Your full name" /></Field>
        <Field label="Email address"><Input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} placeholder="you@example.com" /></Field>
      </div>
      <div className="mt-5 p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
        <div><p className="text-sm font-semibold text-slate-800">Account ID</p><p className="text-xs font-mono text-slate-500">{user?.id || '—'}</p></div>
      </div>
    </>
  );

  const renderOrganization = () => (
    <>
      <SectionHeader icon={Building2} title="Organization settings" description="Manage workspace identity, domains and organization defaults." />
      {!activeOrg ? <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">Select a workspace before editing organization settings.</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
          <Field label="Organization name"><Input value={organization.name} onChange={e => setOrganization({ ...organization, name: e.target.value })} /></Field>
          <Field label="URL slug" hint="Lowercase letters, numbers and hyphens."><Input className="font-mono" value={organization.slug} onChange={e => setOrganization({ ...organization, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} /></Field>
          <Field label="Primary domain"><Input value={organization.primaryDomain} onChange={e => setOrganization({ ...organization, primaryDomain: e.target.value.toLowerCase() })} placeholder="example.com" /></Field>
          <Field label="Logo URL"><Input type="url" value={organization.logoUrl} onChange={e => setOrganization({ ...organization, logoUrl: e.target.value })} placeholder="https://..." /></Field>
          <Field label="Industry"><Input value={organization.industry} onChange={e => setOrganization({ ...organization, industry: e.target.value })} /></Field>
          <Field label="Company size"><Input value={organization.companySize} onChange={e => setOrganization({ ...organization, companySize: e.target.value })} /></Field>
          <Field label="Support email"><Input type="email" value={organization.supportEmail} onChange={e => setOrganization({ ...organization, supportEmail: e.target.value })} /></Field>
          <Field label="Billing email"><Input type="email" value={organization.billingEmail} onChange={e => setOrganization({ ...organization, billingEmail: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Toggle checked={organization.mfaRequired} onChange={checked => setOrganization({ ...organization, mfaRequired: checked })} label="Require MFA for this organization" description="Require members to use multi-factor authentication." icon={ShieldCheck} /></div>
        </div>
      )}
    </>
  );

  const renderSecurity = () => (
    <>
      <SectionHeader icon={ShieldCheck} title="Security settings" description="Control authentication protection and session behavior." />
      <div className="space-y-3 mt-6">
        <Toggle checked={security.mfaEnabled} onChange={checked => setSecurity({ ...security, mfaEnabled: checked })} label="Two-factor authentication" description="Add an additional verification step when signing in." icon={LockKeyhole} />
        <Toggle checked={security.loginAlerts} onChange={checked => setSecurity({ ...security, loginAlerts: checked })} label="Login alerts" description="Notify you when a new sign-in is detected." icon={Bell} />
      </div>
      <div className="mt-5 max-w-sm"><Field label="Session timeout (minutes)" hint="Allowed range: 5–1440 minutes."><Input type="number" min="5" max="1440" value={security.sessionTimeout} onChange={e => setSecurity({ ...security, sessionTimeout: Number(e.target.value) })} /></Field></div>
    </>
  );

  const renderSystem = () => (
    <>
      <SectionHeader icon={SlidersHorizontal} title="System settings" description="Configure application-wide preferences for your workspace." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
        <Field label="Timezone"><select className="w-full decent-input text-sm" value={system.timezone} onChange={e => setSystem({ ...system, timezone: e.target.value })}><option>Asia/Kolkata</option><option>UTC</option><option>America/New_York</option><option>Europe/London</option></select></Field>
        <Field label="Language"><select className="w-full decent-input text-sm" value={system.language} onChange={e => setSystem({ ...system, language: e.target.value })}><option>English</option><option>Hindi</option></select></Field>
      </div>
      <div className="space-y-3 mt-5">
        <Toggle checked={system.emailNotifications} onChange={checked => setSystem({ ...system, emailNotifications: checked })} label="Email notifications" description="Receive product and workspace notifications by email." icon={Bell} />
        <Toggle checked={system.compactMode} onChange={checked => setSystem({ ...system, compactMode: checked })} label="Compact interface" description="Use tighter spacing across data-heavy screens." icon={MonitorCog} />
        <Toggle checked={system.maintenanceMode} onChange={checked => setSystem({ ...system, maintenanceMode: checked })} label="Maintenance mode" description="Show the application maintenance state to users." icon={Globe2} />
      </div>
    </>
  );

  return (
    <div className="max-w-6xl mx-auto text-slate-900">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your profile, organization, security and system preferences.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] gap-5">
        <aside className="bg-white border border-slate-200 rounded-2xl p-2 h-fit shadow-xs">
          {sections.map(section => { const Icon = section.icon; return <NavLink key={section.id} to={`/settings/${section.id}`} className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}><Icon className="w-4 h-4 shrink-0" /><span className="min-w-0"><span className="block text-sm font-semibold">{section.label}</span><span className="block text-[10px] mt-0.5 text-slate-400 truncate">{section.description}</span></span></NavLink>; })}
        </aside>
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-100"><div><p className="text-[10px] uppercase tracking-wider font-bold text-indigo-600">Account</p><p className="text-xs text-slate-400 mt-1">{sectionMeta.description}</p></div><span className="text-xs font-mono text-slate-400">/settings/{activeSection}</span></div>
          {error && <div className="mt-5 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          {saved && <div className="mt-5 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />Changes saved successfully.</div>}
          {activeSection === 'profile' && renderProfile()}
          {activeSection === 'organization' && renderOrganization()}
          {activeSection === 'security' && renderSecurity()}
          {activeSection === 'system' && renderSystem()}
          <div className="mt-7 pt-5 border-t border-slate-100 flex justify-end"><button disabled={isSaving || (activeSection === 'organization' && !activeOrg)} type="submit" className="decent-btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"><>{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}</><span>{isSaving ? 'Saving...' : 'Save changes'}</span></button></div>
        </form>
      </div>
    </div>
  );
};
