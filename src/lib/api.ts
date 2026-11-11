import { demo } from './demo';
import type { AuthResponse, BankAccount, BankTransaction, TransferInput, TransferResult, AuthState } from './types';
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const SESSION_KEY = 'meridian_session_v1';
export function storedSession(): AuthState | null {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') as AuthState | null; }
  catch { return null; }
}
export function saveSession(state: AuthState | null) {
  if (state) sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  else sessionStorage.removeItem(SESSION_KEY);
}
async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const session = storedSession();
  const res = await fetch(`/api${path}`, {
    ...opts, headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.token}` } : {}), ...opts.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    if (res.status === 401 || res.status === 403) {
      if (!path.startsWith('/auth/')) { saveSession(null); window.location.assign('/login'); }
    }
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
export const api = {
  async login(email: string, password: string): Promise<AuthResponse> {
    if (DEMO_MODE) return demo.signIn(email, password);
    return request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },
  async register(fullName: string, email: string, password: string): Promise<AuthResponse> {
    if (DEMO_MODE) return demo.register(fullName, email);
    return request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ fullName, email, password }) });
  },
  async accounts(): Promise<BankAccount[]> {
    if (DEMO_MODE) return demo.accounts();
    return request<BankAccount[]>('/accounts');
  },
  async transactions(id: string): Promise<BankTransaction[]> {
    if (DEMO_MODE) return demo.transactions(id);
    return request<BankTransaction[]>(`/accounts/${encodeURIComponent(id)}/transactions?limit=100`);
  },
  async transfer(input: TransferInput): Promise<TransferResult> {
    if (DEMO_MODE) return demo.transfer(input);
    return request<TransferResult>('/transfers', { method: 'POST', body: JSON.stringify({ ...input, amount: input.amount.toFixed(2) }) });
  },
  async statement(id: string, from: string, to: string): Promise<Blob> {
    if (DEMO_MODE) return demo.statement(id, from, to);
    const session = storedSession();
    const res = await fetch(`/api/accounts/${encodeURIComponent(id)}/statement?from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${session?.token ?? ''}` } });
    if (!res.ok) { const body = await res.json().catch(() => ({})) as { error?: string }; throw new Error(body.error || 'Could not generate statement'); }
    return res.blob();
  }
};
