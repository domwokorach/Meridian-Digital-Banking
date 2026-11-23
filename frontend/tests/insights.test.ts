import { describe, expect, it } from 'vitest';
import { goalProgress, monthlySummary, spendingByCategory, spentThisMonth } from '../src/lib/insights';
import { paymentSchema, transferSchema } from '../src/lib/validators';
import type { BankTransaction } from '../src/lib/types';
const now = new Date('2026-06-15T12:00:00Z');
const tx = (id: string, kind: 'CREDIT' | 'DEBIT', description: string, amount: number, createdAt: string): BankTransaction => ({ id, accountId: 'a', kind, description, amount, balanceAfter: 0, createdAt });
const txns = [
  tx('1', 'DEBIT', 'Coffee · Brew', 4.5, '2026-06-10T10:00:00Z'), tx('2', 'DEBIT', 'Coffee · Other', 0.1, '2026-06-11T10:00:00Z'),
  tx('3', 'CREDIT', 'Salary · Acme', 1000, '2026-06-01T10:00:00Z'), tx('4', 'DEBIT', 'Transfer to Savings · x', 500, '2026-06-12T10:00:00Z'),
  tx('5', 'DEBIT', 'Rent · Landlord', 700, '2026-05-02T10:00:00Z'), tx('6', 'DEBIT', 'Mystery', 10, '2026-06-02T10:00:00Z'),
];
describe('insights', () => {
  it('ignores transfers between own accounts and sums in pence', () => {
    const june = monthlySummary(txns, now).at(-1)!;
    expect(june).toMatchObject({ income: 1000, out: 14.6 });
  });
  it('returns the requested number of months, oldest first', () => {
    const m = monthlySummary(txns, now, 3);
    expect(m.map(x => x.name)).toEqual(['Apr', 'May', 'Jun']);
    expect(m[1].out).toBe(700);
  });
  it('groups spending by category, largest first, with Other as the fallback', () => {
    expect(spendingByCategory(txns)).toEqual([{ name: 'Rent', value: 700 }, { name: 'Other', value: 10 }, { name: 'Coffee', value: 4.6 }]);
  });
  it('totals this month’s spend without transfers', () => { expect(spentThisMonth(txns, now)).toBe(14.6); });
  it('caps goal progress at 100% and rounds saved amounts to pence', () => {
    expect(goalProgress({ id: 'g', name: 'g', target: 100, share: 0.5, targetDate: '2027-01-01' }, 1000)).toEqual({ saved: 500, percent: 100 });
    expect(goalProgress({ id: 'g', name: 'g', target: 1000, share: 0.3333, targetDate: '2027-01-01' }, 100).saved).toBe(33.33);
  });
});
describe('validators', () => {
  const base = { fromAccountId: 'a', toAccountId: 'b', amount: '10', reference: '' };
  it('accepts a valid transfer', () => { expect(transferSchema.safeParse(base).success).toBe(true); });
  it.each(['0', '-1', '1.234', 'abc', '50000.01', ''])('rejects amount %j', amount => { expect(transferSchema.safeParse({ ...base, amount }).success).toBe(false); });
  it('rejects identical accounts', () => { expect(transferSchema.safeParse({ ...base, toAccountId: 'a' }).success).toBe(false); });
  it('limits payment references to 18 characters', () => {
    const pay = { beneficiaryId: 'b1', fromAccountId: 'a', amount: '5', reference: 'x'.repeat(19) };
    expect(paymentSchema.safeParse(pay).success).toBe(false);
    expect(paymentSchema.safeParse({ ...pay, reference: 'x'.repeat(18) }).success).toBe(true);
  });
});
