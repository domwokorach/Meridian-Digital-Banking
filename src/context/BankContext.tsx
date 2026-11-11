import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { BankAccount, BankTransaction } from '../lib/types';
import { useAuth } from './AuthContext';
type Value = { accounts: BankAccount[]; transactions: BankTransaction[]; loading: boolean; error: string; refresh: () => Promise<void> };
const Context = createContext<Value | null>(null);
export function BankProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    if (!session) return;
    setError('');
    try {
      const a = await api.accounts();
      const tx = await Promise.all(a.map(item => api.transactions(item.id)));
      setAccounts(a); setTransactions(tx.flat().sort((x, y) => y.createdAt.localeCompare(x.createdAt)));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load accounts'); }
    finally { setLoading(false); }
  }, [session]);
  useEffect(() => { void refresh(); }, [refresh]);
  return <Context.Provider value={{ accounts, transactions, loading, error, refresh }}>{children}</Context.Provider>;
}
export function useBank() { const ctx = useContext(Context); if (!ctx) throw new Error('BankProvider required'); return ctx; }
