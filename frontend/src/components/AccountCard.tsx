import { ArrowLeftRight, CreditCard, Download, EllipsisVertical, Info, PiggyBank, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { BankAccount } from '../lib/types';
import { accountEnding, maskedAccount, money } from '../lib/format';
export default function AccountCard({ account, compact = false }: { account: BankAccount; compact?: boolean }) {
  const savings = account.accountType === 'SAVINGS';
  const Icon = savings ? PiggyBank : CreditCard;
  const detail = `/app/accounts?account=${account.id}`;
  return <motion.article data-testid="account-card" data-account-type={account.accountType} data-compact={compact || undefined} whileHover={{ y: -2 }} transition={{ duration: 0.16 }}
    className={cn('relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-elevated', compact ? 'p-4' : 'sm:p-6')}>
    <div aria-hidden="true" className={cn('pointer-events-none absolute -top-16 -right-16 size-48 rounded-full blur-3xl', savings ? 'bg-success/15' : 'bg-primary/15')}/>
    <div className="relative flex items-start justify-between">
      <div className="flex items-center gap-3"><span className={cn('flex size-10 items-center justify-center rounded-xl', savings ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary')}><Icon className="size-5"/></span>
        <div><h3 className="text-sm font-medium text-muted-foreground">{account.name}</h3><p className="text-xs text-muted-foreground">{savings ? 'Savings' : 'Current'} · {maskedAccount(account.accountNumber)}</p></div></div>
      <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Actions for ${account.name}`}/>}><EllipsisVertical/></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl">
          <DropdownMenuItem render={<Link to="/app/transfer"/>}><ArrowLeftRight/>Transfer</DropdownMenuItem>
          <DropdownMenuItem render={<Link to="/app/transfer?tab=pay"/>}><Send/>Pay</DropdownMenuItem>
          <DropdownMenuItem render={<Link to="/app/statements"/>}><Download/>Statements</DropdownMenuItem>
          <DropdownMenuItem render={<Link to={detail}/>}><Info/>Account details</DropdownMenuItem>
        </DropdownMenuContent></DropdownMenu>
    </div>
    <div className="relative">
      <p className="sr-only">Available balance</p>
      <div data-testid="account-balance" className="text-3xl font-semibold tracking-tight tabular-nums">{money(account.balance)}</div>
      <p className="mt-1 text-xs text-muted-foreground">Available · Ledger {money(account.balance)}</p>
      <p className="mt-3 text-xs text-muted-foreground">Sort code: {account.sortCode} <span aria-hidden="true">·</span> {accountEnding(account.accountNumber)}</p>
    </div>
    <div className="relative flex flex-wrap gap-2">
      <ButtonLink to="/app/transfer" size="lg" className="h-9 rounded-full px-4">Transfer</ButtonLink>
      <ButtonLink to="/app/transfer?tab=pay" size="lg" variant="secondary" className="h-9 rounded-full px-4">Pay</ButtonLink>
      <ButtonLink to="/app/statements" size="lg" variant="ghost" className="h-9 rounded-full px-3">Statements</ButtonLink>
      <Link to={detail} aria-label={`View ${account.name}`} className="ml-auto inline-flex h-9 items-center rounded-full px-3 text-sm font-medium text-primary outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/60">Details</Link>
    </div>
  </motion.article>;
}
