import { createContext, useContext, useState, type ReactNode } from 'react';
import { api, storedSession, saveSession } from '../lib/api';
import type { AuthState } from '../lib/types';

type AuthContextValue = {
  session: AuthState | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};
const Context = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthState | null>(() => storedSession());
  const update = (value: AuthState | null) => { setSession(value); saveSession(value); };
  return <Context.Provider value={{
    session,
    login: async (email, password) => update(await api.login(email, password)),
    register: async (name, email, password) => update(await api.register(name, email, password)),
    logout: () => update(null),
  }}>{children}</Context.Provider>;
}
export function useAuth() { const ctx = useContext(Context); if (!ctx) throw new Error('AuthProvider required'); return ctx; }
