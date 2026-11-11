import type { AuthState, BankAccount, BankTransaction } from '../src/lib/types';

// Fictional fixtures. The production code never contains these numbers.
export const everyday: BankAccount = { id: 'acc-everyday', name: 'Everyday account', accountType: 'CURRENT', accountNumber: '48271936', sortCode: '20-42-66', balance: 1065.45 };
export const savings: BankAccount = { id: 'acc-savings', name: 'Rainy day savings', accountType: 'SAVINGS', accountNumber: '68104472', sortCode: '20-42-66', balance: 5557.24 };
export const fixtureAccounts: BankAccount[] = [everyday, savings];
export const FIXTURE_TOTAL = '£6,622.69';

const iso = (daysAgo: number) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(12, 0, 0, 0); return d.toISOString(); };
export const fixtureTransactions: BankTransaction[] = [
  { id: 't1', accountId: everyday.id, kind: 'DEBIT', description: 'Coffee · Brew Collective', amount: 9.8, balanceAfter: 1055.65, createdAt: iso(1) },
  { id: 't2', accountId: everyday.id, kind: 'CREDIT', description: 'Salary · Acme Studio', amount: 1149, balanceAfter: 1065.45, createdAt: iso(3) },
  { id: 't3', accountId: savings.id, kind: 'CREDIT', description: 'Monthly savings interest', amount: 16.24, balanceAfter: 5557.24, createdAt: iso(5) },
];
export const session: AuthState = { token: 'test-token', user: { id: 'u1', fullName: 'Alex Morgan', email: 'alex@example.test' } };
