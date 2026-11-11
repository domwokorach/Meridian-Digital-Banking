import type { BankAccount, BankTransaction, TransferInput, TransferResult, User } from './types';

const DATA_KEY = 'meridian_demo_bank_state_v2';
type DemoData = { user: User; accounts: BankAccount[]; transactions: BankTransaction[]; requests: Record<string, TransferResult> };
const stamp = (daysAgo: number, hour = 12) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(hour, 15, 0, 0); return d.toISOString(); };
const demoUser: User = { id: 'demo-user', fullName: 'Alex Morgan', email: 'demo@meridian.test' };
function seed(user: User = demoUser): DemoData {
  const accounts: BankAccount[] = [
    { id: 'demo-current', name: 'Everyday account', accountType: 'CURRENT', accountNumber: '48271936', sortCode: '20-42-66', balance: 1065.45 },
    { id: 'demo-savings', name: 'Rainy day savings', accountType: 'SAVINGS', accountNumber: '68104472', sortCode: '20-42-66', balance: 5557.24 },
  ];
  const values: [string, 'CREDIT' | 'DEBIT', number, number][] = [
    ['Shopping · Studio Supply', 'DEBIT', 126.90, 1], ['Transport · City Rail', 'DEBIT', 38.40, 3],
    ['Coffee · Brew Collective', 'DEBIT', 9.80, 5], ['Salary · Acme Studio', 'CREDIT', 1500, 8],
    ['Groceries · Green Market', 'DEBIT', 68.45, 12], ['Rent · Orchard Living', 'DEBIT', 1240, 24],
    ['Opening demo funds', 'CREDIT', 1049, 45],
  ];
  let bal = accounts[0].balance;
  const currentTxns = values.map(([description, kind, amount, days], i) => {
    const item = { id: `demo-t-${i}`, accountId: accounts[0].id, kind, description, amount, balanceAfter: bal, createdAt: stamp(days) };
    bal += kind === 'DEBIT' ? amount : -amount;
    return item;
  });
  const savingsTxns: BankTransaction[] = [
    { id: 'demo-s-1', accountId: accounts[1].id, kind: 'CREDIT', description: 'Monthly savings interest', amount: 16.24, balanceAfter: 5557.24, createdAt: stamp(6) },
    { id: 'demo-s-2', accountId: accounts[1].id, kind: 'CREDIT', description: 'Opening demo funds', amount: 5541, balanceAfter: 5541, createdAt: stamp(45) },
  ];
  return { user, accounts, transactions: [...currentTxns, ...savingsTxns], requests: {} };
}
function read(): DemoData {
  const raw = localStorage.getItem(DATA_KEY);
  if (raw) { try { return JSON.parse(raw) as DemoData; } catch { /* reseed */ } }
  const value = seed(); write(value); return value;
}
function write(data: DemoData) { localStorage.setItem(DATA_KEY, JSON.stringify(data)); }
export const demo = {
  signIn(email: string, password: string) {
    if (email.toLowerCase().trim() !== demoUser.email || password !== 'Demo1234!') throw new Error('Use the demo credentials shown below the login form');
    const data = read(); return { token: 'demo-session', user: data.user };
  },
  register(fullName: string, email: string) {
    const user: User = { id: 'demo-user', fullName, email };
    write(seed(user)); return { token: 'demo-session', user };
  },
  accounts: () => structuredClone(read().accounts),
  transactions: (id: string) => read().transactions.filter(t => t.accountId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  transfer(input: TransferInput): TransferResult {
    const d = read();
    if (d.requests[input.requestId]) return d.requests[input.requestId];
    const from = d.accounts.find(a => a.id === input.fromAccountId);
    const to = d.accounts.find(a => a.id === input.toAccountId);
    if (!from || !to || from.id === to.id) throw new Error('Choose two different accounts');
    const amount = Math.round(input.amount * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0 || amount > 50000) throw new Error('Enter an amount between £0.01 and £50,000');
    if (from.balance < amount) throw new Error('Insufficient funds for this transfer');
    from.balance = Math.round((from.balance - amount) * 100) / 100;
    to.balance = Math.round((to.balance + amount) * 100) / 100;
    const now = new Date().toISOString();
    const reference = input.reference.trim() || 'Between my accounts';
    const result: TransferResult = { id: crypto.randomUUID(), fromAccountId: from.id, toAccountId: to.id, amount, reference, createdAt: now };
    d.transactions.push({ id: crypto.randomUUID(), accountId: from.id, kind: 'DEBIT', description: `Transfer to ${to.name} · ${reference}`, amount, balanceAfter: from.balance, createdAt: now });
    d.transactions.push({ id: crypto.randomUUID(), accountId: to.id, kind: 'CREDIT', description: `Transfer from ${from.name} · ${reference}`, amount, balanceAfter: to.balance, createdAt: now });
    d.requests[input.requestId] = result;
    write(d); return result;
  },
  statement(id: string, from: string, to: string) {
    const d = read(); const account = d.accounts.find(a => a.id === id);
    if (!account) throw new Error('Account not found');
    const esc = (s: string) => `"${s.replace(/^[=+\-@]/, "'$&").replaceAll('"', '""')}"`;
    const lines = d.transactions.filter(t => t.accountId === id && t.createdAt.slice(0,10) >= from && t.createdAt.slice(0,10) <= to)
      .sort((a,b) => b.createdAt.localeCompare(a.createdAt))
      .map(t => [esc(t.createdAt), esc(account.name), esc(t.kind), esc(t.description), `${t.kind === 'DEBIT' ? '-' : ''}${t.amount.toFixed(2)}`, t.balanceAfter.toFixed(2)].join(','));
    return new Blob([['Date,Account,Type,Description,Amount (GBP),Balance (GBP)', ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  },
};
