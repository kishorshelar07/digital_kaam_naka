/**
 * context/AuthContext.jsx — Fixed: No infinite loop
 * Author: Digital Kaam Naka Dev Team
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { changeLanguage } from '../i18n/i18n';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    // Only try if token exists — avoid useless 401 calls
    const token = localStorage.getItem('kamnaka_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data } = await authService.getMe();
      if (data.success) {
        setUser(data.data);
        if (data.data.language) changeLanguage(data.data.language);
      }
    } catch (err) {
      // Token invalid — clear it, don't retry
      localStorage.removeItem('kamnaka_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user only once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadUser(); }, []); // intentionally once on mount

  const updateUser = (updatedUser) => setUser(prev => ({ ...prev, ...updatedUser }));

  const loginSuccess = (userData, token) => {
    if (token) localStorage.setItem('kamnaka_token', token);
    setUser(userData);
    if (userData?.language) changeLanguage(userData.language);
  };

  const logout = async () => {
    try { await authService.logout(); } catch {}
    localStorage.removeItem('kamnaka_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isLoggedIn:  !!user,
      isWorker:    user?.role === 'worker',
      isEmployer:  user?.role === 'employer',
      isAdmin:     user?.role === 'admin',
      loadUser,
      updateUser,
      loginSuccess,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export default AuthContext;