"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from './api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setToken(null);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setToken(storedToken);
      const res = await api.auth.me();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        throw new Error('Invalid session');
      }
    } catch (error: any) {
      if (error.status === 401) {
        console.warn('Session expired or invalid. User logged out.');
      } else {
        console.error('Auth check failed:', error);
      }
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Run auth check only once on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Redirect unauthenticated users away from protected routes (runs after auth resolves)
  useEffect(() => {
    if (isLoading) return;
    const publicPaths = ['/', '/login', '/register'];
    if (!user && !publicPaths.includes(pathname)) {
      router.push('/login');
    }
  }, [isLoading, user, pathname, router]);

  const login = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(data);
      if (res.success && res.data) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        // Redirect admins to admin dashboard, regular users to dashboard
        const redirectPath = res.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        router.push(redirectPath);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(data);
      if (res.success && res.data) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        // Redirect admins to admin dashboard, regular users to dashboard
        const redirectPath = res.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        router.push(redirectPath);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
