import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest, setAuthToken, getAuthToken } from '../services/api';
import { useToast } from './ToastContext';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'admin' | 'staff';
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const cached = localStorage.getItem('sv_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { warning } = useToast();
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    localStorage.removeItem('sv_user');
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (token) {
      inactivityTimerRef.current = setTimeout(() => {
        warning('Session expired due to 30 minutes of inactivity. Please log in again.');
        logout();
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [token, logout, warning]);

  // Monitor user activity for 30m auto logout
  useEffect(() => {
    if (!token) return;

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => {
      resetInactivityTimer();
    };

    resetInactivityTimer();
    activityEvents.forEach(evt => window.addEventListener(evt, handleActivity));

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleActivity));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [token, resetInactivityTimer]);

  // Handle auth:expired event from API interceptor
  useEffect(() => {
    const handleExpired = () => {
      warning('Session has expired. Please log in again.');
      logout();
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [logout, warning]);

  // Check current session on mount
  useEffect(() => {
    async function loadUser() {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await apiRequest<{ user: AuthUser }>('/auth/me');
        setUser(res.user);
        localStorage.setItem('sv_user', JSON.stringify(res.user));
      } catch (err) {
        logout();
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [logout]);

  const login = async (identifier: string, password: string) => {
    const res = await apiRequest<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });

    setToken(res.token);
    setUser(res.user);
    setAuthToken(res.token);
    localStorage.setItem('sv_user', JSON.stringify(res.user));
    resetInactivityTimer();
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAdmin,
        isStaff
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
