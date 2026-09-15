import React, { useState } from 'react';
import { X, UserPlus, Mail, User, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';

const ROLE_OPTIONS = [
  { id: 'Member', title: 'Member', desc: 'Can view projects and collaborate on workspace resources.' },
  { id: 'Admin', title: 'Admin', desc: 'Can manage workspace settings, invite members, and configure security policies.' },
  { id: 'Billing', title: 'Billing Manager', desc: 'Can manage subscription plans, view invoices, and update payment methods.' },
  { id: 'Owner', title: 'Workspace Owner', desc: 'Full administrative authority, billing control, and workspace deletion rights.' }
];

export const InviteMemberModal = ({ isOpen, onClose, orgId }) => {
  const { inviteMember } = useOrg();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Member');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      await inviteMember(orgId, { name, email, role, note });
      setEmail('');
      setName('');
      setRole('Member');
      setNote('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to dispatch invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Invite Team Member</h3>
              <p className="text-xs text-slate-500">Send an invitation to join your workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-600 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address <span className="text-indigo-600">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full decent-input pl-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full decent-input pl-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assign Role <span className="text-indigo-600">*</span>
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {ROLE_OPTIONS.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-start p-3 rounded-xl border cursor-pointer transition-all ${
                    role === r.id
                      ? 'bg-indigo-50 border-indigo-200 text-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.id}
                    checked={role === r.id}
                    onChange={() => setRole(r.id)}
                    className="mt-1 text-indigo-600 focus:ring-0 accent-indigo-600"
                  />
                  <div className="ml-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{r.title}</span>
                      {r.id === 'Owner' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold border border-purple-200">
                          Full Access
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Personal Note <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Welcome to our workspace! Looking forward to working together."
              className="w-full decent-input text-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="decent-btn-primary text-xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
