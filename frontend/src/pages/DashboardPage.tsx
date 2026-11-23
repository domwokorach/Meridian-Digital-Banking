import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeftRight, ArrowUpRight, ChevronDown, CreditCard, FileText, ShieldCheck, SlidersHorizontal, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import AccountCard from '../components/AccountCard';
import AnimatedMoney from '../components/animations/AnimatedMoney';
import Reveal from '../components/animations/Reveal';
import GoalsPanel from '../components/banking/GoalsPanel';
import CashflowChart from '../components/charts/CashflowChart';
import CategoryChart from '../components/charts/CategoryChart';
import TransactionList from '../components/TransactionList';
import { useAuth } from '../context/AuthContext';
import { useBank } from '../context/BankContext';
import { useDashboardPrefs } from '../hooks/use-dashboard-prefs';
import { firstName, money, sumMoney } from '../lib/format';
import { monthlySummary, spendingByCategory, spentThisMonth } from '../lib/insights';
const VISIBLE_ACCOUNTS = 2;
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
const stamp = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
function DashboardSkeleton() {
  return <div aria-busy="true" aria-label="Loading your accounts" role="status" className="space-y-6"><Skeleton className="h-10 w-72 rounded-xl"/><Skeleton className="h-44 rounded-3xl"/><div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-52 rounded-3xl"/><Skeleton className="h-52 rounded-3xl"/></div><span className="sr-only">Getting your accounts ready…</span></div>;
}
export default function DashboardPage() {
  const { session, lastLogin } = useAuth();
  const { accounts, transactions, loading, error, refresh } = useBank();
  const [prefs, setPref] = useDashboardPrefs();
  const [showAll, setShowAll] = useState(false);
  const total = sumMoney(accounts.map(a => a.balance));
  const savingsBalance = sumMoney(accounts.filter(a => a.accountType === 'SAVINGS').map(a => a.balance));
  const months = useMemo(() => monthlySummary(transactions), [transactions]);
  const categories = useMemo(() => spendingByCategory(transactions), [transactions]);
  const spent = spentThisMonth(transactions);
  const thisMonth = months[months.length - 1];
  if (loading) return <DashboardSkeleton/>;
  if (error) return <Empty className="rounded-3xl border border-border bg-card py-16" role="alert"><EmptyHeader><EmptyTitle>We couldn't load your banking data.</EmptyTitle><EmptyDescription>{error}</EmptyDescription></EmptyHeader><Button onClick={() => void refresh()}>Try again</Button></Empty>;
  const shown = showAll ? accounts : accounts.slice(0, VISIBLE_ACCOUNTS);
  return <div className="space-y-8">
    <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Your financial overview</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{greeting()}, {firstName(session!.user.fullName)}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-success"/>{lastLogin ? `Last successful login ${stamp(lastLogin)}` : 'This is your first sign-in on this browser'}</span><Link to="/app/notifications" className="text-primary hover:underline">Security notifications</Link></p></div>
      <div className="flex flex-wrap gap-2">
        <ButtonLink to="/app/transfer" size="lg" className="h-10 rounded-full px-4"><ArrowLeftRight/>Transfer</ButtonLink>
        <ButtonLink to="/app/statements" size="lg" variant="secondary" className="h-10 rounded-full px-4"><FileText/>Statements</ButtonLink>
        <Popover><PopoverTrigger render={<Button size="lg" variant="outline" className="h-10 rounded-full px-4"/>}><SlidersHorizontal/>Customise</PopoverTrigger>
          <PopoverContent align="end" className="w-64 rounded-2xl"><h2 className="mb-3 text-sm font-semibold">Dashboard sections</h2>
            {([['insights', 'Spending insights'], ['goals', 'Savings goals'], ['activity', 'Recent activity']] as const).map(([k, label]) => <div key={k} className="flex items-center justify-between py-2"><Label htmlFor={`pref-${k}`}>{label}</Label><Switch id={`pref-${k}`} checked={prefs[k]} onCheckedChange={v => setPref(k, v)}/></div>)}</PopoverContent></Popover>
      </div>
    </Reveal>

    <Reveal delay={0.05}><section data-testid="balance-panel" aria-labelledby="total-heading" className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[#12306a] via-[#12234a] to-card p-6 shadow-elevated sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-cyan/20 blur-3xl"/>
      <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div><h2 id="total-heading" className="text-sm font-medium text-[#aab7ce]">Total balance</h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-white tabular-nums sm:text-5xl" data-testid="total-balance"><AnimatedMoney value={total}/></p>
          <p className="mt-2 text-sm text-[#aab7ce]">Across {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} · Spent this month {money(spent)}</p></div>
        <div className="flex gap-6 text-sm"><div><p className="flex items-center gap-1 text-[#aab7ce]"><TrendingUp className="size-4 text-success"/>In this month</p><p className="mt-1 text-lg font-semibold text-white tabular-nums">{money(thisMonth?.income ?? 0)}</p></div><div><p className="flex items-center gap-1 text-[#aab7ce]"><TrendingDown className="size-4 text-destructive"/>Out this month</p><p className="mt-1 text-lg font-semibold text-white tabular-nums">{money(thisMonth?.out ?? 0)}</p></div></div>
      </div></section></Reveal>

    <section aria-labelledby="accounts-heading" className="space-y-4">
      <div className="flex items-center justify-between"><h2 id="accounts-heading" className="text-xl font-semibold tracking-tight">Your accounts <Badge variant="secondary" className="ml-1 align-middle">{accounts.length}</Badge></h2><Link to="/app/accounts" className="text-sm font-medium text-primary hover:underline">View all accounts</Link></div>
      {accounts.length === 0 ? <Empty className="rounded-3xl border border-border bg-card py-12"><EmptyHeader><EmptyTitle>No accounts yet</EmptyTitle><EmptyDescription>Your accounts will appear here once they're opened.</EmptyDescription></EmptyHeader></Empty> :
        <motion.div layout className="grid gap-4 md:grid-cols-2"><AnimatePresence initial={false}>{shown.map(a => <motion.div key={a.id} layout initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: .22 }}><AccountCard account={a}/></motion.div>)}</AnimatePresence></motion.div>}
      {accounts.length > VISIBLE_ACCOUNTS && <Button variant="outline" className="mx-auto flex h-10 rounded-full px-4" aria-expanded={showAll} onClick={() => setShowAll(v => !v)}>{showAll ? 'Show fewer accounts' : `Show all accounts (${accounts.length})`}<ChevronDown className={showAll ? 'rotate-180 transition-transform' : 'transition-transform'}/></Button>}
    </section>

    {prefs.insights && <section aria-label="Financial insights" className="grid gap-4 lg:grid-cols-5">
      <Card className="rounded-3xl lg:col-span-3"><CardHeader><CardTitle className="text-lg">Money in &amp; out</CardTitle><CardDescription>Your last six months, excluding transfers between your own accounts</CardDescription></CardHeader><CardContent><CashflowChart data={months}/></CardContent></Card>
      <Card className="rounded-3xl lg:col-span-2"><CardHeader><CardTitle className="text-lg">Spending categories</CardTitle><CardDescription>All time, from your transaction history</CardDescription></CardHeader><CardContent>{categories.length ? <CategoryChart data={categories}/> : <p className="text-sm text-muted-foreground">No spending yet.</p>}</CardContent></Card>
    </section>}

    <div className="grid gap-4 lg:grid-cols-5">
      {prefs.goals && <Card className="rounded-3xl lg:col-span-2"><CardHeader><CardTitle className="text-lg">Savings goals</CardTitle><CardDescription>Based on your savings balance · <Link to="/app/savings" className="text-primary hover:underline">See all</Link></CardDescription></CardHeader><CardContent><GoalsPanel savingsBalance={savingsBalance}/></CardContent></Card>}
      {prefs.activity && <Card className={prefs.goals ? 'rounded-3xl lg:col-span-3' : 'rounded-3xl lg:col-span-5'}><CardHeader><CardTitle className="text-lg">Recent activity</CardTitle><CardDescription>The latest movements across your accounts · <Link to="/app/accounts" className="text-primary hover:underline">See all transactions</Link></CardDescription></CardHeader><CardContent><TransactionList items={transactions.slice(0, 6)}/></CardContent></Card>}
    </div>

    <div className="grid gap-3 sm:grid-cols-3">{[{ to: '/app/transfer', icon: ArrowLeftRight, t: 'Move money', d: 'Transfer between accounts' }, { to: '/app/cards', icon: CreditCard, t: 'Manage cards', d: 'Freeze, limits and details' }, { to: '/app/accounts', icon: Wallet, t: 'Account details', d: 'Balances and activity' }].map(a => <Link key={a.to} to={a.to} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 outline-none transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/60"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><a.icon className="size-5"/></span><span className="flex-1"><span className="block text-sm font-medium">{a.t}</span><span className="block text-xs text-muted-foreground">{a.d}</span></span><ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/></Link>)}</div>
  </div>;
}
