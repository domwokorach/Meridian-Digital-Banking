import { ArrowDownLeft, ArrowUpRight, Coffee, Home, ShoppingBag, TrainFront, Wallet, type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { cn } from '@/lib/utils';
import type { BankTransaction } from '../lib/types';
import { dateLabel, money } from '../lib/format';
function iconFor(t: BankTransaction): LucideIcon {
  const d = t.description.toLowerCase();
  if (d.includes('coffee')) return Coffee;
  if (d.includes('shopping') || d.includes('groceries')) return ShoppingBag;
  if (d.includes('transport')) return TrainFront;
  if (d.includes('rent')) return Home;
  if (d.includes('transfer')) return t.kind === 'DEBIT' ? ArrowUpRight : ArrowDownLeft;
  return Wallet;
}
export default function TransactionList({ items, showAccount = false }: { items: BankTransaction[]; showAccount?: boolean }) {
  if (!items.length) return <Empty className="py-10"><EmptyHeader><EmptyMedia variant="icon"><Wallet/></EmptyMedia><EmptyTitle>No activity to show</EmptyTitle><EmptyDescription>Transactions for this account will appear here.</EmptyDescription></EmptyHeader></Empty>;
  return <ul className="divide-y divide-border" data-testid="transaction-list">
    <AnimatePresence initial={false}>{items.map(t => {
      const Icon = iconFor(t); const credit = t.kind === 'CREDIT';
      return <motion.li key={t.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex items-center gap-3.5 py-3.5" data-testid="transaction-row">
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', credit ? 'bg-success/15 text-success' : 'bg-secondary text-muted-foreground')}><Icon className="size-[18px]"/></span>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{t.description}</p><p className="text-xs text-muted-foreground">{dateLabel(t.createdAt)}{showAccount ? ' · Account activity' : ''}</p></div>
        <div className="text-right"><p className={cn('text-sm font-semibold tabular-nums', credit && 'text-success')}>{credit ? '+' : '−'}{money(t.amount)}</p><p className="text-xs text-muted-foreground tabular-nums">{money(t.balanceAfter)} balance</p></div>
      </motion.li>;
    })}</AnimatePresence>
  </ul>;
}
