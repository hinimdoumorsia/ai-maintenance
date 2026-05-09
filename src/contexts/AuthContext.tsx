// src/contexts/AuthContext.tsx
// Contexte global d'authentification — gère login, signup, onboarding, session

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const API = 'http://localhost:8000';

/* ─── Types ─────────────────────────────────────────────── */
export interface UserSession {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  id_entreprise: number | null;
  onboarding_done: boolean;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  completeOnboarding: () => void;
  clearError: () => void;
}

export interface SignupData {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role?: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
  completeOnboarding: () => {},
  clearError: () => {},
});

export const useAuth = () => useContext(AuthContext);

/* ─── Provider ───────────────────────────────────────────── */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restaurer la session depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai-maint-session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } catch { /* invalid */ }
    }
    setLoading(false);
  }, []);

  // Persister la session
  const saveSession = (u: UserSession | null) => {
    if (u) {
      localStorage.setItem('ai-maint-session', JSON.stringify(u));
    } else {
      localStorage.removeItem('ai-maint-session');
    }
    setUser(u);
  };

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Identifiants incorrects');
        return false;
      }
      saveSession(data.user);
      return true;
    } catch (e: any) {
      setError('Impossible de contacter le serveur. Vérifiez que le backend est lancé.');
      return false;
    }
  }, []);

  const signup = useCallback(async (signupData: SignupData): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Erreur lors de l'inscription");
        return false;
      }
      saveSession(data.user);
      return true;
    } catch (e: any) {
      setError('Impossible de contacter le serveur. Vérifiez que le backend est lancé.');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    saveSession(null);
  }, []);

  const completeOnboarding = useCallback(() => {
    if (user) {
      const updated = { ...user, onboarding_done: true };
      saveSession(updated);
    }
  }, [user]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, completeOnboarding, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};
