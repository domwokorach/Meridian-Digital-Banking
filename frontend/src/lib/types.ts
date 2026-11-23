export type User = { id: string; fullName: string; email: string };
export type AuthResponse = { token: string; user: User };
export type BankAccount = { id: string; name: string; accountType: 'CURRENT' | 'SAVINGS'; accountNumber: string; sortCode: string; balance: number };
export type BankTransaction = { id: string; accountId: string; kind: 'CREDIT' | 'DEBIT'; description: string; amount: number; balanceAfter: number; createdAt: string };
export type TransferInput = { requestId: string; fromAccountId: string; toAccountId: string; amount: number; reference: string };
export type TransferResult = { id: string; fromAccountId: string; toAccountId: string; amount: number; reference: string; createdAt: string };
export type AuthState = { token: string; user: User };
/** Demo-only content shapes. Real equivalents arrive with the backend endpoints listed in docs/REDESIGN.md. */
export type CardVariant = 'midnight' | 'ocean' | 'titanium' | 'royal';
export type DemoCard = { id: string; label: string; variant: CardVariant; kind: 'DEBIT' | 'CREDIT'; last4: string; holder: string; expiry: string; frozen: boolean; monthlyLimit: number; virtual: boolean };
export type SavingsGoal = { id: string; name: string; target: number; /** Share of the savings balance earmarked for this goal. */ share: number; targetDate: string };
export type AppNotification = { id: string; kind: 'security' | 'activity' | 'info'; title: string; body: string; createdAt: string; read: boolean };
export type Beneficiary = { id: string; name: string; sortCode: string; accountNumber: string };
export type Faq = { question: string; answer: string };
