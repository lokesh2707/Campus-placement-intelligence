import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mobileApi, MobileUser } from '../services/api-client';
import { LoginInput, RegisterInput } from '@campus-os/validation';

interface MobileAuthContextType {
  user: MobileUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const MobileAuthContext = createContext<MobileAuthContextType | undefined>(undefined);

export function MobileAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      await mobileApi.loadStoredTokens();
      if (mobileApi.getAccessToken()) {
        const res = await mobileApi.getMe();
        if (res.data?.user) {
          setUser(res.data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: LoginInput) => {
    setLoading(true);
    try {
      const res = await mobileApi.login(credentials);
      if (res.data?.user) {
        setUser(res.data.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterInput) => {
    setLoading(true);
    try {
      const res = await mobileApi.register(data);
      if (res.data?.user) {
        setUser(res.data.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await mobileApi.logout();
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <MobileAuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </MobileAuthContext.Provider>
  );
}

export function useMobileAuth(): MobileAuthContextType {
  const ctx = useContext(MobileAuthContext);
  if (!ctx) {
    throw new Error('useMobileAuth must be used within MobileAuthProvider');
  }
  return ctx;
}
