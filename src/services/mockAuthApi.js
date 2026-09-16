// Mock Authentication & Session API Service with localStorage persistence

const STORAGE_KEYS = {
  USERS: 'auth_suite_users',
  SESSIONS: 'auth_suite_sessions',
  RESET_TOKENS: 'auth_suite_reset_tokens',
  SETTINGS: 'auth_suite_settings'
};

// Seed initial mock data if empty
const initDatabase = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const seedUsers = [
      {
        id: 'user_101',
        name: 'Alex Vance',
        email: 'alex@example.com',
        passwordHash: 'Password123!', // In production this would be bcrypt hashed
        role: 'Admin',
        isVerified: true,
        verificationCode: null,
        mfaEnabled: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'user_102',
        name: 'Jordan Lee',
        email: 'jordan@example.com',
        passwordHash: 'Password123!',
        role: 'Developer',
        isVerified: false,
        verificationCode: '849201',
        mfaEnabled: false,
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seedUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SESSIONS)) {
    const seedSessions = [
      {
        id: 'sess_default_1',
        userId: 'user_101',
        token: 'mock_token_alex_admin_123',
        deviceName: 'MacBook Pro 16" (Chrome)',
        ipAddress: '192.168.1.45',
        location: 'San Francisco, CA, USA',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        lastActive: new Date().toISOString(),
        isCurrent: true
      }
    ];
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(seedSessions));
  }

  if (!localStorage.getItem(STORAGE_KEYS.RESET_TOKENS)) {
    localStorage.setItem(STORAGE_KEYS.RESET_TOKENS, JSON.stringify({}));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
      networkDelayMs: 600,
      forceError: false,
      autoExpireMinutes: 15
    }));
  }
};

initDatabase();

// Helpers
const getStored = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const setStored = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const getSettings = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');

const delay = (msOverride) => {
  const settings = getSettings();
  const ms = msOverride !== undefined ? msOverride : (settings.networkDelayMs || 500);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (settings.forceError) {
        reject(new Error('Simulated Network / Server Error (500)'));
      } else {
        resolve();
      }
    }, ms);
  });
};

export const mockAuthApi = {
  // --- LOGIN ---
  async login({ email, password, rememberMe = false }) {
    await delay();
    const users = getStored(STORAGE_KEYS.USERS);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new Error('No account found with this email address.');
    }

    if (user.passwordHash !== password) {
      throw new Error('Invalid email or password. Please try again.');
    }

    // Generate session
    const sessions = getStored(STORAGE_KEYS.SESSIONS);
    const sessionDurationHours = rememberMe ? 7 * 24 : 8; // 7 days vs 8 hours
    const token = `token_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + sessionDurationHours * 3600 * 1000).toISOString();

    // Detect browser info
    const ua = navigator.userAgent;
    let deviceName = 'Chrome on Windows';
    if (ua.includes('Firefox')) deviceName = 'Firefox browser';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) deviceName = 'Safari Browser';
    else if (ua.includes('Macintosh')) deviceName = 'MacBook Pro (Chrome)';

    const newSession = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      token,
      deviceName,
      ipAddress: '127.0.0.1 (Local host)',
      location: 'Current Location',
      createdAt: new Date().toISOString(),
      expiresAt,
      lastActive: new Date().toISOString(),
      isCurrent: true
    };

    sessions.push(newSession);
    setStored(STORAGE_KEYS.SESSIONS, sessions);

    // Omit sensitive data
    const { passwordHash, ...userClean } = user;
    return {
      user: userClean,
      session: newSession
    };
  },

  // --- REGISTER ---
  async register({ name, email, password, role = 'User' }) {
    await delay();
    const users = getStored(STORAGE_KEYS.USERS);

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email address already exists.');
    }

    // Generate 6-digit verification OTP code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      passwordHash: password,
      role,
      isVerified: false,
      verificationCode,
      mfaEnabled: false,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    setStored(STORAGE_KEYS.USERS, users);

    const { passwordHash, ...userClean } = newUser;
    return {
      user: userClean,
      verificationCode, // Returned for dev testing visibility
      message: 'Registration successful! Verification code sent to email.'
    };
  },

  // --- VERIFY EMAIL (OTP) ---
  async verifyEmail({ email, code }) {
    await delay();
    const users = getStored(STORAGE_KEYS.USERS);
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
      throw new Error('User account not found.');
    }

    const user = users[userIndex];
    if (user.isVerified) {
      return { success: true, message: 'Account is already verified.' };
    }

    // Allow universal test code '123456' for ease of testing
    if (user.verificationCode !== code && code !== '123456') {
      throw new Error('Invalid verification code. Use 123456 or the code shown in dev toolbar.');
    }

    users[userIndex].isVerified = true;
    users[userIndex].verificationCode = null;
    setStored(STORAGE_KEYS.USERS, users);

    const { passwordHash, ...userClean } = users[userIndex];
    return {
      user: userClean,
      success: true,
      message: 'Account successfully verified!'
    };
  },

  // --- RESEND OTP ---
  async resendVerificationCode({ email }) {
    await delay();
    const users = getStored(STORAGE_KEYS.USERS);
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) throw new Error('Account not found.');

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    users[userIndex].verificationCode = newCode;
    setStored(STORAGE_KEYS.USERS, users);

    return {
      code: newCode,
      message: 'New verification code generated and sent!'
    };
  },

  // --- FORGOT PASSWORD REQUEST ---
  async requestPasswordReset({ email }) {
    await delay();
    const users = getStored(STORAGE_KEYS.USERS);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Return success even if email not found to prevent account enumeration attack
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been dispatched.'
      };
    }

    const resetTokens = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESET_TOKENS) || '{}');
    const token = `reset_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    
    resetTokens[token] = {
      email: user.email,
      userId: user.id,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes validity
    };

    localStorage.setItem(STORAGE_KEYS.RESET_TOKENS, JSON.stringify(resetTokens));

    return {
      success: true,
      token, // Demo visibility
      message: 'Password reset link generated successfully.'
    };
  },

  // --- RESET PASSWORD CONFIRMATION ---
  async resetPassword({ token, newPassword }) {
    await delay();
    const resetTokens = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESET_TOKENS) || '{}');
    const tokenData = resetTokens[token];

    if (!tokenData) {
      throw new Error('Invalid or expired reset token.');
    }

    if (new Date(tokenData.expiresAt) < new Date()) {
      delete resetTokens[token];
      localStorage.setItem(STORAGE_KEYS.RESET_TOKENS, JSON.stringify(resetTokens));
      throw new Error('Password reset token has expired. Please request a new link.');
    }

    const users = getStored(STORAGE_KEYS.USERS);
    const userIndex = users.findIndex(u => u.id === tokenData.userId);

    if (userIndex === -1) {
      throw new Error('User not found.');
    }

    users[userIndex].passwordHash = newPassword;
    setStored(STORAGE_KEYS.USERS, users);

    // Invalidate reset token
    delete resetTokens[token];
    localStorage.setItem(STORAGE_KEYS.RESET_TOKENS, JSON.stringify(resetTokens));

    return {
      success: true,
      message: 'Password updated successfully! You can now log in with your new password.'
    };
  },

  // --- PROFILE / SECURITY SETTINGS ---
  async updateProfile({ userId, name, email }) {
    await delay();
    const users = getStored(STORAGE_KEYS.USERS);
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User account not found.');
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((u, i) => i !== index && u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('That email address is already in use.');
    }
    users[index] = { ...users[index], name: name.trim(), email: normalizedEmail };
    setStored(STORAGE_KEYS.USERS, users);
    const { passwordHash, ...userClean } = users[index];
    return userClean;
  },

  async updateSecurity({ userId, mfaEnabled }) {
    await delay();
    const users = getStored(STORAGE_KEYS.USERS);
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) throw new Error('User account not found.');
    users[index] = { ...users[index], mfaEnabled: !!mfaEnabled };
    setStored(STORAGE_KEYS.USERS, users);
    const { passwordHash, ...userClean } = users[index];
    return userClean;
  },

  // --- LOGOUT ---
  async logout({ token }) {
    await delay(200);
    const sessions = getStored(STORAGE_KEYS.SESSIONS);
    const updatedSessions = sessions.filter(s => s.token !== token);
    setStored(STORAGE_KEYS.SESSIONS, updatedSessions);
    return { success: true };
  },

  // --- VALIDATE SESSION ---
  async validateSession({ token }) {
    await delay(300);
    const sessions = getStored(STORAGE_KEYS.SESSIONS);
    const session = sessions.find(s => s.token === token);

    if (!session) {
      throw new Error('Session not found or invalid.');
    }

    if (new Date(session.expiresAt) < new Date()) {
      setStored(STORAGE_KEYS.SESSIONS, sessions.filter(s => s.token !== token));
      throw new Error('Session token expired. Please log in again.');
    }

    const users = getStored(STORAGE_KEYS.USERS);
    const user = users.find(u => u.id === session.userId);

    if (!user) throw new Error('Associated user no longer exists.');

    const { passwordHash, ...userClean } = user;
    return {
      user: userClean,
      session
    };
  },

  // --- FETCH ACTIVE SESSIONS FOR USER ---
  async getActiveSessions({ userId, currentToken }) {
    await delay(300);
    const sessions = getStored(STORAGE_KEYS.SESSIONS);
    return sessions
      .filter(s => s.userId === userId && new Date(s.expiresAt) > new Date())
      .map(s => ({
        ...s,
        isCurrent: s.token === currentToken
      }));
  },

  // --- REVOKE SPECIFIC SESSION ---
  async revokeSession({ sessionId }) {
    await delay(300);
    const sessions = getStored(STORAGE_KEYS.SESSIONS);
    const filtered = sessions.filter(s => s.id !== sessionId);
    setStored(STORAGE_KEYS.SESSIONS, filtered);
    return { success: true, message: 'Session revoked successfully.' };
  },

  // --- REVOKE ALL OTHER SESSIONS ---
  async revokeAllOtherSessions({ userId, currentToken }) {
    await delay(400);
    const sessions = getStored(STORAGE_KEYS.SESSIONS);
    const filtered = sessions.filter(s => s.userId !== userId || s.token === currentToken);
    setStored(STORAGE_KEYS.SESSIONS, filtered);
    return { success: true, message: 'All other active sessions have been terminated.' };
  },

  // --- DEV TOOLS CONTROL API ---
  devTools: {
    getUsers: () => getStored(STORAGE_KEYS.USERS),
    getSessions: () => getStored(STORAGE_KEYS.SESSIONS),
    getSettings: () => getSettings(),
    updateSettings: (newSettings) => setStored(STORAGE_KEYS.SETTINGS, { ...getSettings(), ...newSettings }),
    resetDatabase: () => {
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.SESSIONS);
      localStorage.removeItem(STORAGE_KEYS.RESET_TOKENS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      initDatabase();
    },
    toggleUserVerification: (userId) => {
      const users = getStored(STORAGE_KEYS.USERS);
      const user = users.find(u => u.id === userId);
      if (user) {
        user.isVerified = !user.isVerified;
        setStored(STORAGE_KEYS.USERS, users);
      }
    }
  }
};
