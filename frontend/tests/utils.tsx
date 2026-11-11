import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../src/context/AuthContext';
import { BankProvider } from '../src/context/BankContext';
import { api } from '../src/lib/api';
import type { AuthState, BankAccount, BankTransaction } from '../src/lib/types';
import { fixtureAccounts, fixtureTransactions, session as defaultSession } from './fixtures';

export const mockedApi = vi.mocked(api);

/** Seeds the API mock; transactions are returned per account like the real endpoint. */
export function mockBank(accounts: BankAccount[] = fixtureAccounts, transactions: BankTransaction[] = fixtureTransactions) {
  mockedApi.accounts.mockResolvedValue(accounts);
  mockedApi.transactions.mockImplementation(async id => transactions.filter(t => t.accountId === id));
}

export function LocationProbe() { const l = useLocation(); return <div data-testid="location">{l.pathname + l.search}</div>; }

type Options = { route?: string; signedIn?: AuthState | null; withBank?: boolean };

/** Renders a page inside the same providers the real app uses. */
export function renderPage(ui: ReactElement, { route = '/', signedIn = defaultSession, withBank = true }: Options = {}) {
  if (signedIn) sessionStorage.setItem('meridian_session_v1', JSON.stringify(signedIn));
  const body = withBank ? <BankProvider>{ui}</BankProvider> : ui;
  return render(<MemoryRouter initialEntries={[route]}><AuthProvider>{body}<LocationProbe/></AuthProvider></MemoryRouter>);
}

/** Renders `ui` at `path` with sibling placeholder routes so navigation can be observed. */
export function renderRoutes(ui: ReactElement, path: string, signedIn: AuthState | null = defaultSession) {
  if (signedIn) sessionStorage.setItem('meridian_session_v1', JSON.stringify(signedIn));
  return render(<MemoryRouter initialEntries={[path]}><AuthProvider><Routes>
    <Route path={path.split('?')[0]} element={ui}/>
    <Route path="*" element={<LocationProbe/>}/>
  </Routes></AuthProvider></MemoryRouter>);
}
