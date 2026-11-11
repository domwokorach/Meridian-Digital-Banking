import { ArrowDownLeft, ArrowUpRight, Coffee, ShoppingBag, TrainFront, Wallet, type LucideIcon } from 'lucide-react';
import type { BankTransaction } from '../lib/types';
import { dateLabel, money } from '../lib/format';
function iconFor(t: BankTransaction): LucideIcon {
  const d = t.description.toLowerCase();
  if (d.includes('coffee')) return Coffee;
  if (d.includes('shopping') || d.includes('groceries')) return ShoppingBag;
  if (d.includes('transport')) return TrainFront;
  if (d.includes('transfer')) return t.kind === 'DEBIT' ? ArrowUpRight : ArrowDownLeft;
  return Wallet;
}
export default function TransactionList({ items, showAccount = false }: { items: BankTransaction[]; showAccount?: boolean }) {
  if (!items.length) return <div className="empty-state"><Wallet size={30}/><h3>No activity to show</h3><p>Transactions for this account will appear here.</p></div>;
  return <div className="transaction-list">
    {items.map(t => {
      const Icon = iconFor(t);
      return <div className="transaction-row" key={t.id}>
        <div className={`txn-icon ${t.kind === 'CREDIT' ? 'txn-positive' : ''}`}><Icon size={19}/></div>
        <div className="transaction-info"><strong>{t.description}</strong><span>{dateLabel(t.createdAt)}{showAccount ? ' · Account activity' : ''}</span></div>
        <div className="transaction-amount"><strong className={t.kind === 'CREDIT' ? 'positive' : ''}>{t.kind === 'CREDIT' ? '+' : '−'}{money(t.amount)}</strong><span>{money(t.balanceAfter)} balance</span></div>
      </div>;
    })}
  </div>;
}
