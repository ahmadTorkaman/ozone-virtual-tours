// ===========================================
// Authentication Context
// ===========================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const { user } = await authApi.me();
      setUser(user);
      setError(null);
    } catch (err) {
      // 401 is expected when not logged in
      if (err.status !== 401) {
        console.error('Auth check failed:', err);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email) => {
    try {
      setError(null);
      const { user } = await authApi.login(email);
      setUser(user);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  }, []);

  const register = useCallback(async (data) => {
    try {
      setError(null);
      const { user } = await authApi.register(data);
      setUser(user);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    login,
    logout,
    register,
    checkAuth,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
