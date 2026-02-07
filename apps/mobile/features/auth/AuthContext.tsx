import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { authService, type RegisterInput } from '@/features/auth/authService';

export type AuthUser = {
  authenticated: true;
  email?: string;
  firstName?: string;
  lastName?: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: true } | { success: false; error: string }>;
  register: (
    input: RegisterInput,
  ) => Promise<{ success: true } | { success: false; error: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const storedToken = await authService.getToken();
        if (cancelled) return;

        if (storedToken) {
          setToken(storedToken);
          setUser({ authenticated: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      async login(email, password) {
        const result = await authService.login(email, password);
        if (!result.success) return result;

        setToken(result.token);
        setUser({ authenticated: true, email });
        return { success: true };
      },
      async register(input) {
        const result = await authService.register(input);
        if (!result.success) return result;

        setToken(result.token);
        setUser({ authenticated: true, email: input.email, firstName: input.firstName, lastName: input.lastName });
        return { success: true };
      },
      async logout() {
        await authService.logout();
        setToken(null);
        setUser(null);
      },
    };
  }, [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
