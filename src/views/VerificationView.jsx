import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';

export const VerificationView = () => {
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [verificationToken, setVerificationToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!verificationToken.trim()) {
      setError('Please enter the verification token from your email.');
      return;
    }
    try {
      setIsSubmitting(true);
      await verifyEmail({ token: verificationToken.trim() });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Verify Account" subtitle="Enter the single-use verification token from your AXIVON ONE email.">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">Verification Token</label>
          <input
            type="text"
            value={verificationToken}
            onChange={(e) => setVerificationToken(e.target.value)}
            placeholder="Paste the token from your email"
            autoComplete="one-time-code"
            required
            className="w-full glass-input rounded-xl py-3 px-4 text-sm font-mono"
          />
          <p className="text-[11px] text-gray-500 mt-2">The backend contract does not expose a frontend resend endpoint; request a new verification email through the supported account flow if needed.</p>
        </div>
        <button type="submit" disabled={isSubmitting || !verificationToken.trim()} className="w-full gradient-btn text-white font-medium py-3 rounded-xl shadow-lg flex items-center justify-center space-x-2 text-sm disabled:opacity-50">
          {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ShieldCheck className="w-4 h-4" /><span>Verify & Continue</span></>}
        </button>
      </form>
      <div className="text-center pt-4">
        <Link to="/login" className="inline-flex items-center space-x-2 text-xs text-gray-400 hover:text-white"><ArrowLeft className="w-3.5 h-3.5" /><span>Back to Login</span></Link>
      </div>
    </AuthLayout>
  );
};
