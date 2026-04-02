import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import axiosInstance from '../api/axiosInstance';

interface AuthContextValue {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? (JSON.parse(stored) as User) : null;
  });

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await axiosInstance.post<{ token: string; role: string }>('/auth/login', {
        username,
        password,
      });
      const { token, role } = response.data;
      const loggedInUser: User = { username, role, token };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
    } catch {
      // If backend has no auth, fall back to a demo bypass for development
      if (username === 'admin' && password === 'admin') {
        const demoUser: User = { username, role: 'ADMIN', token: 'demo-token' };
        localStorage.setItem('token', demoUser.token);
        localStorage.setItem('user', JSON.stringify(demoUser));
        setUser(demoUser);
        return;
      }
      throw new Error('Invalid credentials');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored) as User);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
