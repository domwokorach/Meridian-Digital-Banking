import type { BankTransaction, SavingsGoal } from './types';
import { sumMoney } from './format';
/** Own-account transfers are neither income nor spending, so analytics ignore them. */
const isTransfer = (t: BankTransaction) => /^transfer\b/i.test(t.description);
export type MonthSummary = { name: string; income: number; out: number };
export function monthlySummary(txns: BankTransaction[], now = new Date(), months = 6): MonthSummary[] {
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const included = txns.filter(t => { const x = new Date(t.createdAt); return !isTransfer(t) && x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear(); });
    return {
      name: d.toLocaleString('en-GB', { month: 'short' }),
      income: sumMoney(included.filter(t => t.kind === 'CREDIT').map(t => t.amount)),
      out: sumMoney(included.filter(t => t.kind === 'DEBIT').map(t => t.amount)),
    };
  });
}
/** Descriptions look like “Category · Merchant”; anything else is grouped as “Other”. */
export function categoryOf(t: BankTransaction) { const [head, tail] = t.description.split(' · '); return tail ? head : 'Other'; }
export function spendingByCategory(txns: BankTransaction[]) {
  const totals = new Map<string, number>();
  for (const t of txns) if (t.kind === 'DEBIT' && !isTransfer(t)) totals.set(categoryOf(t), (totals.get(categoryOf(t)) ?? 0) + Math.round(t.amount * 100));
  return [...totals].map(([name, cents]) => ({ name, value: cents / 100 })).sort((a, b) => b.value - a.value);
}
export function spentThisMonth(txns: BankTransaction[], now = new Date()) {
  return sumMoney(txns.filter(t => { const x = new Date(t.createdAt); return t.kind === 'DEBIT' && !isTransfer(t) && x.getMonth() === now.getMonth() && x.getFullYear() === now.getFullYear(); }).map(t => t.amount));
}
export function goalProgress(goal: SavingsGoal, savingsBalance: number) {
  const saved = Math.round(savingsBalance * goal.share * 100) / 100;
  return { saved, percent: Math.min(100, Math.round((saved / goal.target) * 100)) };
}
export function groupByDay(txns: BankTransaction[]) {
  const groups = new Map<string, BankTransaction[]>();
  for (const t of txns) { const key = t.createdAt.slice(0, 10); groups.set(key, [...(groups.get(key) ?? []), t]); }
  return [...groups].map(([day, items]) => ({ day, items }));
}
