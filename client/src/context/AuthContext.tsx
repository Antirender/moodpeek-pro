import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AuthResponse,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  User,
  RegisterPayload,
  login as loginRequest,
  register as registerRequest,
} from '../lib/api';
import { applyThemePreference, getStoredThemePreference, ThemePreference } from '../lib/theme';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyUserTheme = useCallback((userToApply: User | null) => {
    const preference: ThemePreference = userToApply?.preferences?.theme || getStoredThemePreference();
    applyThemePreference(preference);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      applyUserTheme(null);
      return;
    }
    try {
      const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
      const storedUser = window.localStorage.getItem(USER_STORAGE_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        applyUserTheme(parsedUser);
      } else {
        applyUserTheme(null);
      }
    } catch (error) {
      console.warn('Failed to restore auth state:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persistAuth = useCallback((auth: AuthResponse) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, auth.token);
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(auth.user));
    }
    setToken(auth.token);
    setUser(auth.user);
    applyThemePreference(auth.user.preferences?.theme || getStoredThemePreference());
    return auth;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    return persistAuth(response);
  }, [persistAuth]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await registerRequest(payload);
    return persistAuth(response);
  }, [persistAuth]);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
    setToken(null);
    setUser(null);
    applyThemePreference(getStoredThemePreference());
  }, []);

  const refreshUser = useCallback((nextUser: User) => {
    setUser(nextUser);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    }
    applyThemePreference(nextUser.preferences?.theme || getStoredThemePreference());
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      applyUserTheme(null);
    }
  }, [user, isLoading, applyUserTheme]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  }), [user, token, isLoading, login, register, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
