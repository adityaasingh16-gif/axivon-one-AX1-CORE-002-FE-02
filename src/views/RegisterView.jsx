import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, XCircle, UserPlus, AlertCircle } from 'lucide-react';

export const RegisterView = () => {
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [confirmPassword,setConfirmPassword]=useState('');
  const [showPassword,setShowPassword]=useState(false); const [isSubmitting,setIsSubmitting]=useState(false); const [error,setError]=useState('');
  const { register } = useAuth(); const navigate=useNavigate();
  const checks={min:password.length>=8,upper:/[A-Z]/.test(password),digit:/[0-9]/.test(password),special:/[!@#$%^&*(),.?":{}|<>]/.test(password)};
  const valid=Object.values(checks).every(Boolean);
  const handleSubmit=async(e)=>{e.preventDefault();setError('');if(!name.trim()||!email.trim()||!password){setError('Please complete all required fields.');return;}if(password!==confirmPassword){setError('Passwords do not match.');return;}if(!valid){setError('Please strengthen your password before proceeding.');return;}try{setIsSubmitting(true);await register({name,email,password});navigate('/verify');}catch(err){setError(err.message||'Registration failed.');}finally{setIsSubmitting(false);}};
  return <AuthLayout title="Create Your Account" subtitle="Create your AXIVON ONE account.">
    {error&&<div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2"><AlertCircle className="w-4 h-4"/><span>{error}</span></div>}
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div><label className="block text-xs font-semibold text-gray-300 mb-1">Full Name</label><div className="relative"><User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"/><input value={name} onChange={e=>setName(e.target.value)} required className="w-full human-input rounded-xl py-2 pl-10 pr-4"/></div></div>
      <div><label className="block text-xs font-semibold text-gray-300 mb-1">Work Email Address</label><div className="relative"><Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full human-input rounded-xl py-2 pl-10 pr-4"/></div></div>
      <div><label className="block text-xs font-semibold text-gray-300 mb-1">Password</label><div className="relative"><Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"/><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} required className="w-full human-input rounded-xl py-2 pl-10 pr-10"/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">{showPassword?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div>
        {password&&<div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">{[['min','8+ Characters'],['upper','1 Uppercase'],['digit','1 Number'],['special','1 Special']].map(([k,l])=><span key={k} className={checks[k]?'text-emerald-400':'text-gray-500'}>{checks[k]?<CheckCircle2 className="inline w-3 h-3"/>:<XCircle className="inline w-3 h-3" />} {l}</span>)}</div>}
      </div>
      <div><label className="block text-xs font-semibold text-gray-300 mb-1">Confirm Password</label><div className="relative"><ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2"/><input type={showPassword?'text':'password'} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required className="w-full human-input rounded-xl py-2 pl-10 pr-4"/></div></div>
      <button type="submit" disabled={isSubmitting||!valid} className="w-full gradient-btn text-white font-medium py-3 rounded-xl shadow-lg flex items-center justify-center space-x-2 text-sm disabled:opacity-50">{isSubmitting?<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<><UserPlus className="w-4 h-4"/><span>Create Account</span></>}</button>
    </form>
    <div className="text-center pt-4 mt-4 border-t border-white/5 text-xs text-gray-400">Already have an account? <Link to="/login" className="text-indigo-400 font-semibold">Sign in</Link></div>
  </AuthLayout>;
};
