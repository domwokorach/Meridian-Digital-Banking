import type { AppNotification, Beneficiary, BankAccount, BankTransaction, DemoCard, Faq, SavingsGoal, TransferInput, TransferResult, User } from './types';

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
    ['Coffee · Brew Collective', 'DEBIT', 9.80, 5], ['Salary · Acme Studio', 'CREDIT', 1149, 8],
    ['Groceries · Green Market', 'DEBIT', 68.45, 12], ['Rent · Orchard Living', 'DEBIT', 1240, 24],
    ['Opening demo funds', 'CREDIT', 1400, 45],
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

/** Fictional, clearly synthetic content for screens that have no backend endpoint yet. Never shown as real data. */
export const demoContent = {
  cards: (holder: string): DemoCard[] => [
    { id: 'card-midnight', label: 'Everyday debit', variant: 'midnight', kind: 'DEBIT', last4: '4821', holder, expiry: '09/29', frozen: false, monthlyLimit: 5000, virtual: false },
    { id: 'card-ocean', label: 'Online shopping', variant: 'ocean', kind: 'DEBIT', last4: '7714', holder, expiry: '03/28', frozen: false, monthlyLimit: 1500, virtual: true },
    { id: 'card-titanium', label: 'Travel credit', variant: 'titanium', kind: 'CREDIT', last4: '3069', holder, expiry: '11/30', frozen: false, monthlyLimit: 8000, virtual: false },
    { id: 'card-royal', label: 'Premier credit', variant: 'royal', kind: 'CREDIT', last4: '9152', holder, expiry: '06/30', frozen: true, monthlyLimit: 12000, virtual: false },
  ] as DemoCard[],
  goals: [
    { id: 'goal-holiday', name: 'Summer holiday', target: 2400, share: 0.3, targetDate: '2027-06-01' },
    { id: 'goal-emergency', name: 'Emergency fund', target: 10000, share: 0.55, targetDate: '2027-12-31' },
    { id: 'goal-laptop', name: 'New laptop', target: 1800, share: 0.15, targetDate: '2027-03-15' },
  ] as SavingsGoal[],
  notifications: ((): AppNotification[] => [
    { id: 'n1', kind: 'security', title: 'New sign-in detected', body: 'You signed in from a new browser. If this was not you, change your password.', createdAt: stamp(0, 9), read: false },
    { id: 'n2', kind: 'activity', title: 'Salary received', body: 'A payment from Acme Studio arrived in your Everyday account.', createdAt: stamp(8, 8), read: false },
    { id: 'n3', kind: 'info', title: 'Statement ready', body: 'Your latest statement is ready to download.', createdAt: stamp(10, 10), read: true },
    { id: 'n4', kind: 'activity', title: 'Savings interest paid', body: 'Monthly interest was added to your savings.', createdAt: stamp(6, 7), read: true },
  ])(),
  beneficiaries: [
    { id: 'b1', name: 'Jordan Ellis', sortCode: '40-11-22', accountNumber: '51847362' },
    { id: 'b2', name: 'Orchard Living (Rent)', sortCode: '30-90-12', accountNumber: '90216478' },
    { id: 'b3', name: 'Priya Natarajan', sortCode: '60-04-18', accountNumber: '33058127' },
  ] as Beneficiary[],
  faqs: [
    { question: 'Is Meridian a real bank?', answer: 'No. Meridian is a fictional portfolio application. No real money, accounts or payment services are provided.' },
    { question: 'How do I move money between my accounts?', answer: 'Open Payments & Transfers, choose the accounts and an amount, then review and confirm. Both balances update once the server accepts the transfer.' },
    { question: 'Why are some screens labelled “Demo data”?', answer: 'Cards, savings goals, notifications and payees have no backend endpoint yet, so they use clearly labelled sample content.' },
    { question: 'Can I download my transactions?', answer: 'Yes. Statements lets you pick an account and a date range and downloads a CSV.' },
    { question: 'What should I do if I notice something suspicious?', answer: 'Freeze the affected card from Cards, change your password, and raise a request with Support.' },
  ] as Faq[],
};
