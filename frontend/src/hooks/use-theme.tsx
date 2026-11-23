import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
export type Theme = 'dark' | 'light';
const KEY = 'meridian_theme';
const initial = (): Theme => { try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; } };
const Context = createContext<{ theme: Theme; toggle: () => void } | null>(null);
/** Dark is the default. The class lives on <html> so portalled popovers and dialogs inherit the tokens. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initial);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    return () => document.documentElement.classList.remove('dark');
  }, [theme]);
  const toggle = useCallback(() => setTheme(t => { const next = t === 'dark' ? 'light' : 'dark'; try { localStorage.setItem(KEY, next); } catch { /* storage unavailable */ } return next; }), []);
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useTheme() { const ctx = useContext(Context); if (!ctx) throw new Error('ThemeProvider required'); return ctx; }
