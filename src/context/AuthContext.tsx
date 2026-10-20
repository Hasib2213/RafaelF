"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User, LoginPayload, LoginResponse } from "@/lib/types/auth";
import {
  authApi,
  getStoredUser,
  getAccessToken,
  clearAuthSession,
  setAuthSession,
} from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload, rememberMe?: boolean) => Promise<LoginResponse>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = getStoredUser();
        const token = getAccessToken();

        if (token) {
          if (storedUser) {
            setUser(storedUser);
          }
          // Fetch freshest user profile in background
          try {
            const profile = await authApi.getProfile();
            setUser(profile);
          } catch {
            // If token expired and cannot be refreshed, user is cleared in api.ts
          }
        }
      } catch (err) {
        console.error("Failed to initialize auth:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (payload: LoginPayload, rememberMe: boolean = true): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(payload);
      setUser(response.user);
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const updated = await authApi.getProfile();
      setUser(updated);
      return updated;
    } catch {
      return null;
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
