import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { mockAuthApi } from '../services/mockAuthApi';

const AuthContext = createContext(null);

const SESSION_TOKEN_KEY = 'auth_suite_active_token';
const REMEMBER_ME_KEY = 'auth_suite_remember_me';

// Auto-lock inactivity timeout (10 minutes idle -> prompt warning, 1 min countdown -> force logout)
const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const WARNING_DURATION_SEC = 60;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(SESSION_TOKEN_KEY) || sessionStorage.getItem(SESSION_TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Inactivity / Auto-lock State
  const [isIdleWarningOpen, setIsIdleWarningOpen] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(WARNING_DURATION_SEC);
  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

  // Helper Toast dispatch
  const showToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Validate active session token on mount or token change
  const checkAuth = useCallback(async () => {
    const activeToken = localStorage.getItem(SESSION_TOKEN_KEY) || sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (!activeToken) {
      setUser(null);
      setSession(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await mockAuthApi.validateSession({ token: activeToken });
      setUser(data.user);
      setSession(data.session);
      setToken(activeToken);
    } catch (err) {
      console.warn('Session validation failed:', err.message);
      // Clear expired session
      localStorage.removeItem(SESSION_TOKEN_KEY);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      setUser(null);
      setSession(null);
      setToken(null);
      showToast('Session expired or invalidated. Please log in again.', 'warning', 'Session Ended');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Inactivity Monitor Logic
  const resetIdleTimer = useCallback(() => {
    if (!user) return;
    if (isIdleWarningOpen) return; // Don't reset if warning modal is active

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    idleTimerRef.current = setTimeout(() => {
      setIsIdleWarningOpen(true);
      setIdleCountdown(WARNING_DURATION_SEC);
    }, IDLE_TIMEOUT_MS);
  }, [user, isIdleWarningOpen]);

  // Idle countdown interval when warning is open
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

    return () => {
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    };
  }, [isIdleWarningOpen]);

  // Listen to user activity (mousemove, keydown, click) to reset idle timer
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

  // Auth Operations
  const handleLogin = async ({ email, password, rememberMe }) => {
    try {
      const data = await mockAuthApi.login({ email, password, rememberMe });
      setUser(data.user);
      setSession(data.session);
      setToken(data.session.token);

      if (rememberMe) {
        localStorage.setItem(SESSION_TOKEN_KEY, data.session.token);
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
      } else {
        sessionStorage.setItem(SESSION_TOKEN_KEY, data.session.token);
      }

      showToast(`Welcome back, ${data.user.name}!`, 'success', 'Login Successful');
      return data;
    } catch (err) {
      showToast(err.message, 'error', 'Login Failed');
      throw err;
    }
  };

  const handleRegister = async ({ name, email, password, role }) => {
    try {
      const data = await mockAuthApi.register({ name, email, password, role });
      showToast(`Verification code sent to ${email}`, 'info', 'Account Created');
      return data;
    } catch (err) {
      showToast(err.message, 'error', 'Registration Failed');
      throw err;
    }
  };

  const handleVerifyEmail = async ({ email, code }) => {
    try {
      const data = await mockAuthApi.verifyEmail({ email, code });
      if (user && user.email.toLowerCase() === email.toLowerCase()) {
        setUser(data.user);
      }
      showToast(data.message, 'success', 'Verified');
      return data;
    } catch (err) {
      showToast(err.message, 'error', 'Verification Failed');
      throw err;
    }
  };

  const handleResendCode = async (email) => {
    try {
      const data = await mockAuthApi.resendVerificationCode({ email });
      showToast(`New verification code sent! (Code: ${data.code})`, 'info', 'Code Resent');
      return data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleForgotPassword = async (email) => {
    try {
      const data = await mockAuthApi.requestPasswordReset({ email });
      showToast(data.message, 'info', 'Reset Email Sent');
      return data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleResetPassword = async ({ token, newPassword }) => {
    try {
      const data = await mockAuthApi.resetPassword({ token, newPassword });
      showToast(data.message, 'success', 'Password Reset Complete');
      return data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const updateUserProfile = async ({ name, email }) => {
    if (!user) throw new Error('You must be signed in to update your profile.');
    try {
      const updatedUser = await mockAuthApi.updateProfile({ userId: user.id, name, email });
      setUser(updatedUser);
      showToast('Profile details updated successfully.', 'success', 'Profile Updated');
      return updatedUser;
    } catch (err) {
      showToast(err.message, 'error', 'Profile Update Failed');
      throw err;
    }
  };

  const updateUserSecurity = async ({ mfaEnabled }) => {
    if (!user) throw new Error('You must be signed in to update security settings.');
    try {
      const updatedUser = await mockAuthApi.updateSecurity({ userId: user.id, mfaEnabled });
      setUser(updatedUser);
      showToast(mfaEnabled ? 'Two-factor authentication enabled.' : 'Two-factor authentication disabled.', 'success', 'Security Updated');
      return updatedUser;
    } catch (err) {
      showToast(err.message, 'error', 'Security Update Failed');
      throw err;
    }
  };

  const handleLogout = async (reason) => {
    try {
      if (token) {
        await mockAuthApi.logout({ token });
      }
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      setUser(null);
      setSession(null);
      setToken(null);
      setIsIdleWarningOpen(false);
      showToast(reason || 'You have logged out successfully.', 'info', 'Logged Out');
    }
  };

  // Dev tools helper methods
  const devToolsAction = {
    expireCurrentSession: () => {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      setUser(null);
      setSession(null);
      setToken(null);
      showToast('Current session token forcefully cleared by Dev Tool.', 'warning', 'Dev Trigger');
    },
    toggleCurrentVerification: () => {
      if (!user) return;
      mockAuthApi.devTools.toggleUserVerification(user.id);
      setUser(prev => prev ? { ...prev, isVerified: !prev.isVerified } : null);
      showToast(`User verification toggled to ${!user.isVerified}`, 'info');
    },
    triggerInactivityWarning: () => {
      setIsIdleWarningOpen(true);
      setIdleCountdown(WARNING_DURATION_SEC);
      showToast('Simulated 10-minute inactivity timeout warning.', 'warning');
    },
    reloadUserSession: () => {
      checkAuth();
      showToast('Refreshed session state from storage.', 'info');
    }
  };

  const value = {
    user,
    session,
    token,
    isLoading,
    isAuthenticated: !!user,
    isVerified: user?.isVerified ?? false,
    toasts,
    showToast,
    removeToast,
    isIdleWarningOpen,
    idleCountdown,
    stayLoggedIn,
    login: handleLogin,
    register: handleRegister,
    verifyEmail: handleVerifyEmail,
    resendCode: handleResendCode,
    forgotPassword: handleForgotPassword,
    resetPassword: handleResetPassword,
    updateUserProfile,
    updateUserSecurity,
    logout: handleLogout,
    checkAuth,
    devToolsAction
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
