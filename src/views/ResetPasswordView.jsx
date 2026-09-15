import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const ResetPasswordView = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || 'demo_mock_reset_token';
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState('');

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const isValid = hasMinLength && hasUppercase && hasDigit && hasSpecial;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!isValid) {
      setError('Password does not meet security requirements.');
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword({ token, newPassword });
      setIsCompleted(true);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Choose a strong, unique password to secure your account credentials."
    >
      {isCompleted ? (
        <div className="space-y-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Password Updated!</h3>
            <p className="text-sm text-gray-300">
              Your account password has been successfully reset. You can now log in using your new credentials.
            </p>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full gradient-btn text-white font-medium py-3 rounded-xl shadow-lg flex items-center justify-center space-x-2 text-sm"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Token Active Banner */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 flex items-center justify-between">
            <span className="text-gray-400">Security Token:</span>
            <span className="font-mono text-indigo-300 font-semibold text-[11px] truncate max-w-[200px]">
              {token}
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="NewPassword123!"
                required
                className="w-full glass-input rounded-xl py-2.5 pl-10 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full glass-input rounded-xl py-2.5 pl-10 pr-4 text-sm"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="w-full gradient-btn text-white font-medium py-3 rounded-xl shadow-lg flex items-center justify-center space-x-2 text-sm disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Save New Password</span>
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs text-gray-400 hover:text-white transition-colors">
              Cancel & Return to Login
            </Link>
          </div>

        </form>
      )}
    </AuthLayout>
  );
};
