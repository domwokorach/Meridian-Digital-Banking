import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { demoContent } from '../lib/demo';
import type { AppNotification } from '../lib/types';
type Value = { items: AppNotification[]; unread: number; markRead: (id: string) => void; markAllRead: () => void };
const Context = createContext<Value | null>(null);
/** Demo notifications held in memory; swap `useState` seed for an API call when the backend exposes /notifications. */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AppNotification[]>(() => demoContent.notifications);
  const markRead = useCallback((id: string) => setItems(list => list.map(n => n.id === id ? { ...n, read: true } : n)), []);
  const markAllRead = useCallback(() => setItems(list => list.map(n => ({ ...n, read: true }))), []);
  const value = useMemo(() => ({ items, unread: items.filter(n => !n.read).length, markRead, markAllRead }), [items, markRead, markAllRead]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useNotifications() { const ctx = useContext(Context); if (!ctx) throw new Error('NotificationProvider required'); return ctx; }
