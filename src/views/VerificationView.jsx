import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';

export const VerificationView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, verifyEmail, resendCode, showToast } = useAuth();

  // Retrieve email passed via state or active user
  const email = location.state?.email || user?.email || 'user@example.com';
  const defaultCode = location.state?.code || '123456';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const inputRefs = useRef([]);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSimulateFill = () => {
    // Fill test code 123456 or generated code
    const digits = (defaultCode || '123456').padStart(6, '0').split('');
    setOtp(digits);
    showToast(`Auto-filled verification code (${digits.join('')})`, 'info');
  };

  const handleVerifySubmit = async (e) => {
    e?.preventDefault();
    const codeString = otp.join('');

    if (codeString.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await verifyEmail({ email, code: codeString });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Verification code failed. Use test code 123456.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendClick = async () => {
    if (resendTimer > 0) return;
    try {
      await resendCode(email);
      setResendTimer(30);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthLayout
      title="Verify Account"
      subtitle={`We have dispatched a 6-digit security code to ${email}`}
    >
      {/* Dev helper callout */}
      <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Dev Code: <strong className="text-white font-mono">{defaultCode}</strong> (or universal <strong className="text-white font-mono">123456</strong>)</span>
        </div>
        <button
          type="button"
          onClick={handleSimulateFill}
          className="px-2.5 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/30 text-cyan-200 font-semibold transition-colors"
        >
          Auto-Fill Code
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleVerifySubmit} className="space-y-6">
        
        {/* OTP Input Boxes */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 text-center mb-3">
            Enter 6-Digit Verification Code
          </label>
          <div className="flex items-center justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono font-bold text-xl sm:text-2xl glass-input rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || otp.join('').length !== 6}
          className="w-full gradient-btn text-white font-medium py-3 rounded-xl shadow-lg flex items-center justify-center space-x-2 text-sm disabled:opacity-50 transition-all"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Verify & Continue</span>
            </>
          )}
        </button>

        {/* Resend Code Section */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-gray-400">
          <span>Didn't receive the email?</span>
          <button
            type="button"
            onClick={handleResendClick}
            disabled={resendTimer > 0}
            className="flex items-center space-x-1.5 font-semibold text-indigo-400 hover:text-indigo-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resendTimer > 0 ? '' : 'animate-spin-once'}`} />
            <span>{resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}</span>
          </button>
        </div>

      </form>
    </AuthLayout>
  );
};
