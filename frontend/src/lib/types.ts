export type User = { id: string; fullName: string; email: string };
export type AuthResponse = { token: string; user: User };
export type BankAccount = { id: string; name: string; accountType: 'CURRENT' | 'SAVINGS'; accountNumber: string; sortCode: string; balance: number };
export type BankTransaction = { id: string; accountId: string; kind: 'CREDIT' | 'DEBIT'; description: string; amount: number; balanceAfter: number; createdAt: string };
export type TransferInput = { requestId: string; fromAccountId: string; toAccountId: string; amount: number; reference: string };
export type TransferResult = { id: string; fromAccountId: string; toAccountId: string; amount: number; reference: string; createdAt: string };
export type AuthState = { token: string; user: User };
