import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, AlertCircle, Globe, Code } from 'lucide-react';

export const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { login, showToast } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email address and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await login({ email, password, rememberMe });
      if (!res.user.isVerified) {
        navigate('/verify', { state: { email: res.user.email } });
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialMock = (provider) => {
    setEmail('alex@example.com');
    setPassword('Password123!');
    showToast(`Simulated SSO login via ${provider}`, 'info');
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your enterprise workspace account"
    >
      {/* Social Single Sign-On Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          onClick={() => handleSocialMock('Google Workspace')}
          className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition-all"
        >
          <Globe className="w-4 h-4 text-indigo-600" />
          <span>Google SSO</span>
        </button>
        <button
          type="button"
          onClick={() => handleSocialMock('GitHub OAuth')}
          className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition-all"
        >
          <Code className="w-4 h-4 text-slate-800" />
          <span>GitHub</span>
        </button>
      </div>

      <div className="relative flex items-center justify-center mb-4">
        <div className="w-full border-t border-slate-200" />
        <span className="bg-white px-3 text-[11px] font-medium text-slate-400 shrink-0">
          or sign in with email
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center space-x-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              required
              className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 transition-all outline-none"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-900 placeholder-slate-400 transition-all outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-600 font-medium">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
            />
            <span>Remember me on this device</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 text-xs shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all mt-2 cursor-pointer"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In to Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Register Link */}
      <div className="text-center pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500">
        Don't have an account?{' '}
        <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
          Create an account
        </Link>
      </div>
    </AuthLayout>
  );
};
