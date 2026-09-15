import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, XCircle, UserPlus, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export const RegisterView = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Developer');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password validation breakdown
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const calculateStrength = () => {
    let score = 0;
    if (hasMinLength) score += 25;
    if (hasUppercase) score += 25;
    if (hasDigit) score += 25;
    if (hasSpecial) score += 25;
    return score;
  };

  const strengthScore = calculateStrength();

  const getStrengthColor = () => {
    if (strengthScore <= 25) return 'bg-red-500';
    if (strengthScore <= 50) return 'bg-amber-500';
    if (strengthScore <= 75) return 'bg-yellow-400';
    return 'bg-emerald-500';
  };

  const getStrengthLabel = () => {
    if (strengthScore === 0) return 'Enter a password';
    if (strengthScore <= 25) return 'Weak — add more characters';
    if (strengthScore <= 50) return 'Fair — throw in a number';
    if (strengthScore <= 75) return 'Good — almost bulletproof!';
    return 'Rock Solid 🔒';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Double check your entries.');
      return;
    }

    if (strengthScore < 75) {
      setError('Please strengthen your password before proceeding.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await register({ name, email, password, role });
      navigate('/verify', { state: { email, code: res.verificationCode } });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create Your Account 🚀"
      subtitle="Join over 10,000+ teams managing tokenized sessions with confidence."
    >
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah Connor"
              required
              className="w-full human-input rounded-xl py-2 pl-10 pr-4"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Work Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@company.com"
              required
              className="w-full human-input rounded-xl py-2 pl-10 pr-4"
            />
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Primary Role
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['User', 'Developer', 'Admin'].map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  role === r
                    ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200 shadow-sm'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password123!"
              required
              className="w-full human-input rounded-xl py-2 pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength Meter Bar */}
          {password && (
            <div className="mt-2 space-y-1.5 p-2.5 rounded-xl bg-black/40 border border-white/5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Password Quality:</span>
                <span className="font-semibold text-gray-200">{getStrengthLabel()}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                  style={{ width: `${strengthScore}%` }}
                />
              </div>

              {/* Requirements Checklist */}
              <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                <span className={`flex items-center space-x-1 ${hasMinLength ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {hasMinLength ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>8+ Characters</span>
                </span>
                <span className={`flex items-center space-x-1 ${hasUppercase ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {hasUppercase ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>1 Uppercase Letter</span>
                </span>
                <span className={`flex items-center space-x-1 ${hasDigit ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {hasDigit ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>1 Number</span>
                </span>
                <span className={`flex items-center space-x-1 ${hasSpecial ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {hasSpecial ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>1 Special Symbol</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full human-input rounded-xl py-2 pl-10 pr-4"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full human-btn-primary py-3 rounded-xl flex items-center justify-center space-x-2 text-sm disabled:opacity-50 transition-all mt-2"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

      </form>

      <div className="text-center pt-2 border-t border-white/5 text-xs text-gray-400">
        Already registered?{' '}
        <Link to="/login" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
};
