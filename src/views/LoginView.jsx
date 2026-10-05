import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) { setError('Please enter both email address and password.'); return; }
    try {
      setIsSubmitting(true);
      const res = await login({ email, password, rememberMe });
      if (!res.user.emailVerified) navigate('/verify');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally { setIsSubmitting(false); }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your enterprise workspace account">
      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center space-x-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label><div className="relative"><Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" /><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" required className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none" /></div></div>
        <div><div className="flex items-center justify-between mb-1.5"><label className="text-xs font-semibold text-slate-700">Password</label><Link to="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:underline">Forgot Password?</Link></div><div className="relative"><Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" /><input type={showPassword?'text':'password'} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" required className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-900 outline-none" /><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3.5 top-3 text-slate-400">{showPassword?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div></div>
        <label className="flex items-center space-x-2 text-xs text-slate-600"><input type="checkbox" checked={rememberMe} onChange={(e)=>setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-indigo-600" /><span>Remember me on this device</span></label>
        <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 text-xs disabled:opacity-50">{isSubmitting?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<><LogIn className="w-4 h-4"/><span>Sign In to Account</span><ArrowRight className="w-4 h-4"/></>}</button>
      </form>
      <div className="text-center pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500">Don't have an account? <Link to="/register" className="font-bold text-indigo-600 hover:underline">Create an account</Link></div>
    </AuthLayout>
  );
};
