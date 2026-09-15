import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export const ForgotPasswordView = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');
  const [error, setError] = useState('');

  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your account email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await forgotPassword(email);
      setSentSuccess(true);
      if (res.token) {
        setGeneratedToken(res.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your registered account email to receive a password recovery link."
    >
      {sentSuccess ? (
        <div className="space-y-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Check Your Inbox</h3>
            <p className="text-sm text-gray-300">
              We have dispatched password recovery instructions to <strong className="text-white">{email}</strong>.
            </p>
          </div>

          {/* Dev Demo Link */}
          {generatedToken && (
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-left text-xs space-y-2">
              <div className="flex items-center space-x-1.5 text-indigo-300 font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>Demo Password Reset Shortcut:</span>
              </div>
              <p className="text-gray-400 text-[11px]">
                In production, the user would click the email link. For testing, use the button below:
              </p>
              <Link
                to={`/reset-password?token=${generatedToken}`}
                className="inline-block w-full text-center py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
              >
                Proceed to Reset Password Page
              </Link>
            </div>
          )}

          <Link
            to="/login"
            className="inline-flex items-center space-x-2 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Account Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                required
                className="w-full glass-input rounded-xl py-2.5 pl-10 pr-4 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full gradient-btn text-white font-medium py-3 rounded-xl shadow-lg flex items-center justify-center space-x-2 text-sm disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Password Reset Link</span>
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>

        </form>
      )}
    </AuthLayout>
  );
};
