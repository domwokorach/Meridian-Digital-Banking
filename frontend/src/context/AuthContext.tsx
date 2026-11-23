import { createContext, useContext, useState, type ReactNode } from 'react';
import { api, storedSession, saveSession } from '../lib/api';
import type { AuthState } from '../lib/types';

type AuthContextValue = {
  session: AuthState | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  /** ISO time of the previous successful sign-in on this browser (demo: kept client-side until the API returns it). */
  lastLogin: string | null;
};
const LAST_KEY = 'meridian_last_login_v1', PREV_KEY = 'meridian_prev_login_v1';
const safe = (f: () => string | null) => { try { return f(); } catch { return null; } };
const Context = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthState | null>(() => storedSession());
  const [lastLogin] = useState<string | null>(() => safe(() => sessionStorage.getItem(PREV_KEY)));
  const [prev, setPrev] = useState<string | null>(lastLogin);
  const stamp = () => safe(() => { const before = localStorage.getItem(LAST_KEY); const now = new Date().toISOString(); localStorage.setItem(LAST_KEY, now); if (before) sessionStorage.setItem(PREV_KEY, before); setPrev(before); return before; });
  const update = (value: AuthState | null) => { setSession(value); saveSession(value); };
  return <Context.Provider value={{
    session,
    login: async (email, password) => { update(await api.login(email, password)); stamp(); },
    register: async (name, email, password) => { update(await api.register(name, email, password)); stamp(); },
    lastLogin: prev,
    logout: () => update(null),
  }}>{children}</Context.Provider>;
}
export function useAuth() { const ctx = useContext(Context); if (!ctx) throw new Error('AuthProvider required'); return ctx; }
