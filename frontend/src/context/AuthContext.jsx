import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth as authApi } from '../api/client';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: null,
      loading: false,
      isAuthenticated: false,
      isAdmin: false,
      login: async () => {},
      logout: () => {},
      updateUser: () => {},
      loginWithGoogle: async () => {},
      sendVerificationCode: async () => {},
      verifyAndRegister: async () => {},
      forgotPassword: async () => {},
      resetPassword: async () => {},
      register: async () => {},
      verifyEmail: async () => {},
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    // H-2 fix: decode JWT and check expiry before restoring session
    const isTokenExpired = (token) => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
      } catch {
        return true; // treat unreadable token as expired
      }
    };

    if (storedUser && storedUser !== 'undefined' && storedToken) {
      if (isTokenExpired(storedToken)) {
        // Token expired — clear session silently
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setToken(storedToken);

        // Fetch fresh profile from backend (sync avatar across devices).
        // Use skipAutoLogout: true so a stale/expired token here does NOT
        // trigger the global 401 redirect in client.js — which would race
        // with product/category data fetches and blank out the page.
        authApi.getProfile({ headers: { 'X-Skip-Auto-Logout': 'true' } })
          .then(res => {
            if (res.data) {
              const freshUser = { ...parsed, ...res.data };
              if (res.data.avatar) {
                freshUser.avatar = res.data.avatar;
                const lowerEmail = parsed.email.toLowerCase().trim();
                localStorage.setItem(`user_avatar_${lowerEmail}`, res.data.avatar);
                localStorage.setItem(`userPhoto_${lowerEmail}`, res.data.avatar);
                localStorage.setItem('userPhoto', res.data.avatar);
              }
              setUser(freshUser);
              localStorage.setItem('user', JSON.stringify(freshUser));
            }
          })
          .catch(err => {
            console.warn('Could not sync fresh profile:', err);
            // If the token is expired, clear it silently without redirecting
            if (err?.response?.status === 401) {
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              setUser(null);
              setToken(null);
            }
          });
      } catch (e) {
        console.error("Error parsing stored user data:", e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const syncUserAvatar = (userData) => {
    if (!userData) return userData;
    const lowerEmail = (userData.email || '').toLowerCase().trim();
    const avatarPic = userData.avatar || userData.photo || userData.photoUrl || (lowerEmail ? localStorage.getItem(`user_avatar_${lowerEmail}`) : null);
    if (avatarPic) {
      userData.avatar = avatarPic;
      if (lowerEmail) {
        localStorage.setItem(`user_avatar_${lowerEmail}`, avatarPic);
        localStorage.setItem(`userPhoto_${lowerEmail}`, avatarPic);
      }
      localStorage.setItem('userPhoto', avatarPic);
    }
    return userData;
  };

  const login = async (email, password) => {
    try {
      const cleanEmail = (email || '').trim();
      const res = await authApi.login(cleanEmail, password);
      let userData = res.data?.user || {
        email: res.data?.email || cleanEmail,
        name: res.data?.name || 'User',
        role: res.data?.role || 'CUSTOMER',
        avatar: res.data?.avatar || res.data?.photoUrl || null
      };
      userData = syncUserAvatar(userData);
      setUser(userData);
      setToken(res.data?.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', res.data?.token);
      toast.success('សូមស្វាគមន៍ការត្រឡប់មកវិញ!');
      return userData;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your email and password.');
      throw error;
    }
  };

  const loginWithGoogle = async (idToken) => {
    try {
      const res = await authApi.googleLogin(idToken);
      let userData = res.data?.user || {
        email: res.data?.email,
        name: res.data?.name,
        role: res.data?.role,
        avatar: res.data?.avatar || res.data?.photoUrl || null
      };
      userData = syncUserAvatar(userData);
      setUser(userData);
      setToken(res.data?.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', res.data?.token);
      toast.success('សូមស្វាគមន៍ការត្រឡប់មកវិញ!');
      return userData;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Google login failed');
      throw error;
    }
  };

  /** Step 1 – Sends a 4-digit OTP to the user's email */
  const sendVerificationCode = async (email, password, name) => {
    try {
      await authApi.sendVerificationCode(email, password, name);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification code');
      throw error;
    }
  };

  /** Step 2 – Verifies the OTP, creates the account, and logs the user in */
  const verifyAndRegister = async (email, code) => {
    try {
      const res = await authApi.verifyEmail(email, code);
      let userData = res.data?.user || {
        email: res.data?.email,
        name: res.data?.name,
        role: res.data?.role,
        avatar: res.data?.avatar || res.data?.photoUrl || null
      };
      userData = syncUserAvatar(userData);
      setUser(userData);
      setToken(res.data?.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', res.data?.token);
      toast.success(' Account created! Welcome to Saby Shop!');
      return userData;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
      throw error;
    }
  };

  const updateUser = async (updates) => {
    try {
      await authApi.updateProfile(updates);
    } catch (err) {
      console.warn('Profile update API not available, saving locally:', err);
    }
    let updated = { ...user, ...updates };
    updated = syncUserAvatar(updated);
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const forgotPassword = async (email) => {
    try {
      const res = await authApi.forgotPassword(email);
      toast.success(res.data?.message || 'Verification code sent to your email!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset code');
      throw error;
    }
  };

  const resetPassword = async (email, code, newPassword) => {
    try {
      const res = await authApi.resetPassword(email, code, newPassword);
      toast.success(res.data?.message || 'Password reset successfully! Please login.');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset failed');
      throw error;
    }
  };

  const logout = async () => {
    if (user?.email) {
      try {
        // [Fix-3] No email param needed — backend reads it from the JWT principal
        await authApi.logout();
      } catch (err) {
        console.warn('Backend logout notification warning:', err);
      }
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.success('Logged out successfully!');
    window.location.href = '/login';
  };

  const value = {
    user,
    token,
    loading,
    login,
    loginWithGoogle,
    sendVerificationCode,
    verifyAndRegister,
    forgotPassword,
    resetPassword,
    updateUser,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
