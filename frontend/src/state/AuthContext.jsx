import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'rrms-auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(`${STORAGE_KEY}-token`) || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const persist = (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    localStorage.setItem(`${STORAGE_KEY}-token`, nextToken);
  };

  const login = async (email, password) => {
    const res = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
    persist(res.data.user, res.data.token);
    return res.data.user;
  };

  const register = async (name, email, password) => {
    const res = await apiRequest('/auth/register', { method: 'POST', body: { name, email, password } });
    persist(res.data.user, res.data.token);
    return res.data.user;
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}-token`);
  };

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: Boolean(user && token)
  }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
};
