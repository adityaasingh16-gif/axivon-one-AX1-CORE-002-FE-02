import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '../services/authApi';

const AuthContext = createContext(null);
const SESSION_TOKEN_KEY = 'auth_suite_active_token';
const REFRESH_TOKEN_KEY = 'auth_suite_refresh_token';
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const WARNING_DURATION_SEC = 60;

const normalizeUser = (user) => user ? ({
  ...user,
  name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || user.email,
  isVerified: user.emailVerified ?? user.isVerified ?? false,
  role: user.roles?.[0] || user.role || 'User',
}) : null;

const normalizeSession = (session, token) => session ? ({
  ...session,
  token,
  deviceName: session.deviceType || session.deviceName || 'Current Browser',
}) : null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(SESSION_TOKEN_KEY) || sessionStorage.getItem(SESSION_TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [isIdleWarningOpen, setIsIdleWarningOpen] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(WARNING_DURATION_SEC);
  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

  const showToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type, title }]);
    window.setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const persistTokens = useCallback((tokens, rememberMe) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    const other = rememberMe ? sessionStorage : localStorage;
    storage.setItem(SESSION_TOKEN_KEY, tokens.accessToken);
    storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    other.removeItem(SESSION_TOKEN_KEY);
    other.removeItem(REFRESH_TOKEN_KEY);
    setToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    setUser(null);
    setSession(null);
    setToken(null);
    setRefreshToken(null);
  }, []);

  const checkAuth = useCallback(async () => {
    const activeToken = localStorage.getItem(SESSION_TOKEN_KEY) || sessionStorage.getItem(SESSION_TOKEN_KEY);
    const activeRefresh = localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (!activeToken) {
      clearSession();
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await authApi.refresh(activeRefresh);
      const normalized = normalizeUser(data.user);
      setUser(normalized);
      setSession(normalizeSession(data.session, data.tokens.accessToken));
      persistTokens(data.tokens, Boolean(localStorage.getItem(REFRESH_TOKEN_KEY)));
    } catch (err) {
      clearSession();
      showToast('Your session has expired. Please sign in again.', 'warning', 'Session Ended');
    } finally {
      setIsLoading(false);
    }
  }, [clearSession, persistTokens, showToast]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const handleLogout = useCallback(async (reason) => {
    try {
      if (token) await authApi.logout(token);
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      clearSession();
      setIsIdleWarningOpen(false);
      showToast(reason || 'You have logged out successfully.', 'info', 'Logged Out');
    }
  }, [token, clearSession, showToast]);

  const resetIdleTimer = useCallback(() => {
    if (!user || isIdleWarningOpen) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsIdleWarningOpen(true);
      setIdleCountdown(WARNING_DURATION_SEC);
    }, IDLE_TIMEOUT_MS);
  }, [user, isIdleWarningOpen]);

  useEffect(() => {
    if (!isIdleWarningOpen) return;
    warningTimerRef.current = setInterval(() => {
      setIdleCountdown(prev => {
        if (prev <= 1) {
          clearInterval(warningTimerRef.current);
          handleLogout('Auto-logout due to inactivity for security.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(warningTimerRef.current);
  }, [isIdleWarningOpen, handleLogout]);

  useEffect(() => {
    if (!user) return;
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    const handler = () => resetIdleTimer();
    events.forEach(e => window.addEventListener(e, handler));
    resetIdleTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [user, resetIdleTimer]);

  const stayLoggedIn = () => {
    setIsIdleWarningOpen(false);
    setIdleCountdown(WARNING_DURATION_SEC);
    resetIdleTimer();
    showToast('Session extended.', 'success');
  };

  const handleLogin = async ({ email, password, rememberMe }) => {
    try {
      const data = await authApi.login({ email, password });
      setUser(normalizeUser(data.user));
      setSession(normalizeSession(data.session, data.tokens.accessToken));
      persistTokens(data.tokens, rememberMe);
      showToast('Welcome back!', 'success', 'Login Successful');
      return data;
    } catch (err) {
      showToast(err.message, 'error', 'Login Failed');
      throw err;
    }
  };

  const handleRegister = async ({ name, email, password }) => {
    try {
      const data = await authApi.register({ name, email, password });
      showToast('If the email is available, a verification link has been sent.', 'info', 'Account Created');
      return data;
    } catch (err) {
      showToast(err.message, 'error', 'Registration Failed');
      throw err;
    }
  };

  const handleVerifyEmail = async ({ token: verificationToken }) => {
    try {
      const data = await authApi.verifyEmail({ token: verificationToken });
      setUser(normalizeUser(data.user));
      showToast('Email address verified.', 'success', 'Verified');
      return data;
    } catch (err) {
      showToast(err.message, 'error', 'Verification Failed');
      throw err;
    }
  };

  const handleResendCode = async () => {
    throw new Error('Resend is not exposed by the approved authentication API contract.');
  };

  const handleForgotPassword = async (email) => {
    try {
      const data = await authApi.forgotPassword(email);
      showToast(data?.message || 'If an account exists, a reset link has been sent.', 'info', 'Reset Email Sent');
      return data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleResetPassword = async ({ token, newPassword }) => {
    try {
      const data = await authApi.resetPassword({ token, newPassword });
      showToast(data?.message || 'Password updated successfully.', 'success', 'Password Reset');
      return data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const updateUserProfile = async ({ name, email }) => {
    if (!user) throw new Error('You must be signed in.');
    const parts = name.trim().split(/\s+/);
    const data = await apiUserRequest('/users/' + encodeURIComponent(user.id) + '/profile', {
      method: 'PATCH',
      token,
      body: { firstName: parts.shift() || '', lastName: parts.join(' '), email: email.trim() },
    });
    const updated = normalizeUser(data?.data ?? data);
    setUser(updated);
    showToast('Profile updated successfully.', 'success', 'Profile Updated');
    return updated;
  };

  const updateUserSecurity = async () => {
    throw new Error('Security settings are not exposed by the approved backend user contract in this build.');
  };

  const devToolsAction = {
    expireCurrentSession: () => { clearSession(); showToast('Current session cleared.', 'warning', 'Dev Trigger'); },
    toggleCurrentVerification: () => showToast('Verification cannot be toggled from the production API.', 'info'),
    triggerInactivityWarning: () => { setIsIdleWarningOpen(true); setIdleCountdown(WARNING_DURATION_SEC); },
    reloadUserSession: checkAuth,
  };

  const value = {
    user, session, token, isLoading, isAuthenticated: !!user,
    isVerified: user?.isVerified ?? false, toasts, showToast, removeToast,
    isIdleWarningOpen, idleCountdown, stayLoggedIn,
    login: handleLogin, register: handleRegister, verifyEmail: handleVerifyEmail,
    resendCode: handleResendCode, forgotPassword: handleForgotPassword,
    resetPassword: handleResetPassword, updateUserProfile, updateUserSecurity,
    logout: handleLogout, checkAuth, devToolsAction,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const apiUserRequest = async (path, options) => {
  const { apiRequest } = await import('../services/apiClient');
  return apiRequest(path, options);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
