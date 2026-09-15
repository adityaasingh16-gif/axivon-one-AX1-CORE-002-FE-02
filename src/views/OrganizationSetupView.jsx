import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { Building2, ArrowLeft, ArrowRight, ShieldCheck, Check, Globe, Mail, Sparkles, Layers, Shield, Loader2 } from 'lucide-react';

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

const PLANS = [
  {
    id: 'Free',
    title: 'Free Developer',
    price: '$0 / mo',
    desc: 'For small projects and prototype testing.',
    features: ['Up to 5 Team Members', 'Basic Auth & Sessions', 'Community Support']
  },
  {
    id: 'Pro',
    title: 'Pro Workspace',
    price: '$49 / mo',
    desc: 'For growing teams requiring enhanced security.',
    features: ['Up to 15 Team Members', 'Enforced MFA & Password Policies', 'Priority Support', 'Custom Branding']
  },
  {
    id: 'Enterprise',
    title: 'Enterprise Suite',
    price: '$499 / mo',
    desc: 'For organizations with complex compliance needs.',
    features: ['Unlimited Seats', 'Domain Whitelisting & SAML SSO', 'Dedicated Account Manager', '24/7 SLA Support']
  }
];

export const OrganizationSetupView = () => {
  const { createOrg } = useOrg();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    industry: 'Technology & Software',
    companySize: '10-49 employees',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    primaryDomain: '',
    supportEmail: '',
    billingEmail: '',
    plan: 'Pro',
    mfaRequired: true
  });

  const handleNameChange = (val) => {
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const autoDomain = autoSlug ? `${autoSlug}.com` : '';
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: autoSlug,
      primaryDomain: prev.primaryDomain || autoDomain
    }));
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!formData.name.trim()) {
        setError('Organization name is required.');
        return;
      }
      if (!formData.slug.trim()) {
        setError('URL Slug is required.');
        return;
      }
    } else if (step === 2) {
      if (!formData.primaryDomain.trim()) {
        setError('Primary domain is required.');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setIsSubmitting(true);
      const newOrg = await createOrg(formData);
      navigate(`/organizations/${newOrg.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create organization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto text-slate-900 space-y-6">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <button
          onClick={() => navigate('/organizations')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center space-x-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Organizations</span>
        </button>

        <span className="text-xs text-slate-500 font-medium">Step {step} of 3</span>
      </div>

      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-sm">
          <Building2 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Setup New Organization Workspace
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure workspace identity, domain policies, and security settings.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center space-x-3">
        {[
          { num: 1, label: 'Workspace Details' },
          { num: 2, label: 'Branding & Domain' },
          { num: 3, label: 'Plan & Security' }
        ].map((s) => (
          <div key={s.num} className="flex items-center space-x-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === s.num
                ? 'bg-indigo-600 text-white shadow-xs'
                : step > s.num
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
            </div>
            <span className={`text-xs font-semibold hidden sm:inline ${step === s.num ? 'text-slate-900' : 'text-slate-400'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Form Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>1. Organization Details</span>
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization Name <span className="text-indigo-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Acme Global Corporation"
                  className="w-full decent-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Workspace Slug <span className="text-indigo-600">*</span>
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-600">
                  <span className="px-3 text-xs text-slate-400 border-r border-slate-200 font-mono">
                    app.nexus.io/
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    placeholder="acme-corp"
                    className="w-full bg-transparent px-3 py-2.5 text-xs text-slate-900 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Industry Sector
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
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center space-x-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>2. Branding & Domain Configuration</span>
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Domain <span className="text-indigo-600">*</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.primaryDomain}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryDomain: e.target.value.toLowerCase() }))}
                    placeholder="company.com"
                    className="w-full decent-input pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization Logo URL
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
                    Support Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={formData.supportEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, supportEmail: e.target.value }))}
                      placeholder="support@company.com"
                      className="w-full decent-input pl-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Billing Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={formData.billingEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, billingEmail: e.target.value }))}
                      placeholder="billing@company.com"
                      className="w-full decent-input pl-9 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>3. Subscription Plan & Security Policies</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setFormData(prev => ({ ...prev, plan: p.id }))}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.plan === p.id
                        ? 'bg-indigo-50 border-indigo-600 text-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">{p.title}</span>
                      {formData.plan === p.id && <Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <div className="text-lg font-extrabold text-indigo-600 mb-1">{p.price}</div>
                    <p className="text-[11px] text-slate-500 mb-3">{p.desc}</p>
                    <ul className="space-y-1 text-[11px] text-slate-600 border-t border-slate-200/80 pt-2">
                      {p.features.map(f => (
                        <li key={f} className="flex items-center space-x-1">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Enforce Mandatory Multi-Factor Authentication (MFA)</span>
                    <span className="text-[11px] text-slate-500">Require all invited workspace members to set up MFA.</span>
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
            </div>
          )}

          {/* Bottom Nav */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="decent-btn-primary text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 ml-auto"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="decent-btn-primary text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 ml-auto disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Workspace...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Organization Workspace</span>
                  </>
                )}
              </button>
            )}
          </div>

        </form>
      </div>

    </div>
  );
};
