import React, { useState, useEffect } from 'react';
import { X, Shield, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';

const ROLE_OPTIONS = [
  { id: 'Member', title: 'Member', desc: 'Standard member access.' },
  { id: 'Admin', title: 'Admin', desc: 'Can edit settings and manage team.' },
  { id: 'Billing', title: 'Billing Manager', desc: 'Manages plans & invoices.' },
  { id: 'Owner', title: 'Workspace Owner', desc: 'Full administrative control.' }
];

export const EditMemberRoleModal = ({ isOpen, onClose, member, orgId }) => {
  const { updateMemberRole, removeMember } = useOrg();
  const [role, setRole] = useState('Member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (member) {
      setRole(member.role || 'Member');
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setIsSubmitting(true);
      await updateMemberRole(orgId, member.id, role);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update member role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm(`Are you sure you want to remove ${member.name} (${member.email}) from this workspace?`)) {
      return;
    }

    try {
      setIsRemoving(true);
      await removeMember(orgId, member.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to remove member.');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
              {member.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{member.name}</h3>
              <p className="text-xs text-slate-500">{member.email}</p>
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

        <form onSubmit={handleUpdate} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Role
            </label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((r) => (
                <label
                  key={r.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    role === r.id
                      ? 'bg-indigo-50 border-indigo-200 text-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="editRole"
                      value={r.id}
                      checked={role === r.id}
                      onChange={() => setRole(r.id)}
                      className="text-indigo-600 focus:ring-0 accent-indigo-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{r.title}</div>
                      <div className="text-[11px] text-slate-500">{r.desc}</div>
                    </div>
                  </div>
                  <Shield className={`w-4 h-4 ${role === r.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleRemove}
              disabled={isRemoving || isSubmitting}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors flex items-center space-x-1.5"
            >
              {isRemoving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Remove</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="decent-btn-primary text-xs font-semibold px-4 py-1.5 rounded-xl shadow-xs flex items-center space-x-1.5"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Save Role</span>}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
