import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { mockOrgApi } from '../services/mockOrgApi';
import { Building2, ArrowLeft, Save, Globe, Mail, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const INDUSTRIES = [
  'Technology & Software',
  'Finance & Banking',
  'Healthcare & Life Sciences',
  'E-commerce & Retail',
  'Education & EdTech',
  'Media & Entertainment',
  'Consulting & Services',
  'Artificial Intelligence'
];

const COMPANY_SIZES = [
  '1-9 employees',
  '10-49 employees',
  '50-249 employees',
  '250-999 employees',
  '1,000+ employees'
];

export const OrganizationEditView = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const { updateOrg, showToast } = useOrg();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logoUrl: '',
    primaryDomain: '',
    isDomainVerified: false,
    industry: '',
    companySize: '',
    supportEmail: '',
    billingEmail: '',
    mfaRequired: false
  });

  const loadOrg = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await mockOrgApi.getOrganization(orgId);
      setFormData({
        name: data.name || '',
        slug: data.slug || '',
        logoUrl: data.logoUrl || '',
        primaryDomain: data.primaryDomain || '',
        isDomainVerified: !!data.isDomainVerified,
        industry: data.industry || INDUSTRIES[0],
        companySize: data.companySize || COMPANY_SIZES[0],
        supportEmail: data.supportEmail || '',
        billingEmail: data.billingEmail || '',
        mfaRequired: !!data.mfaRequired
      });
    } catch (err) {
      showToast(err.message || 'Failed to load organization details.', 'error');
      navigate('/organizations');
    } finally {
      setIsLoading(false);
    }
  }, [orgId, navigate, showToast]);

  useEffect(() => {
    loadOrg();
  }, [loadOrg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Organization name cannot be empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateOrg(orgId, formData);
      navigate(`/organizations/${orgId}`);
    } catch (err) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 text-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto text-slate-900 space-y-6">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <button
          onClick={() => navigate(`/organizations/${orgId}`)}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center space-x-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspace Details</span>
        </button>

        <span className="text-xs font-mono text-indigo-600">Editing /{formData.slug}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <Building2 className="w-6 h-6 text-indigo-600" />
          <span>Edit Organization Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Update organization profile, domains, branding assets, and security parameters.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Organization Name <span className="text-indigo-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full decent-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL Slug
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                className="w-full decent-input text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Logo Image URL
            </label>
            <input
              type="url"
              value={formData.logoUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
              placeholder="https://example.com/logo.png"
              className="w-full decent-input text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Domain
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.primaryDomain}
                  onChange={(e) => setFormData(prev => ({ ...prev, primaryDomain: e.target.value.toLowerCase() }))}
                  className="w-full decent-input pl-9 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Domain Verification Status
              </label>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isDomainVerified: !prev.isDomainVerified }))}
                className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all ${
                  formData.isDomainVerified
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{formData.isDomainVerified ? 'Verified Domain' : 'Unverified Domain (Click to toggle)'}</span>
                </div>
                <span>{formData.isDomainVerified ? 'Verified' : 'Verify Now'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full decent-input text-xs"
              >
                {INDUSTRIES.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Size
              </label>
              <select
                value={formData.companySize}
                onChange={(e) => setFormData(prev => ({ ...prev, companySize: e.target.value }))}
                className="w-full decent-input text-xs"
              >
                {COMPANY_SIZES.map(sz => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Support Contact Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, supportEmail: e.target.value }))}
                  className="w-full decent-input pl-9 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Billing Contact Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={formData.billingEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, billingEmail: e.target.value }))}
                  className="w-full decent-input pl-9 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Mandatory MFA Policy</span>
                <span className="text-[11px] text-slate-500">Require all members to authenticate with MFA.</span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.mfaRequired}
                onChange={(e) => setFormData(prev => ({ ...prev, mfaRequired: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigate(`/organizations/${orgId}`)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="decent-btn-primary text-xs font-semibold px-5 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
