import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, Download, Search } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import AccountCard from '../components/AccountCard';
import AnimatedMoney from '../components/animations/AnimatedMoney';
import TransactionList from '../components/TransactionList';
import { useBank } from '../context/BankContext';
export default function AccountsPage() {
  const { accounts, transactions, loading } = useBank();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('account') || accounts[0]?.id || '';
  const [filter, setFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [query, setQuery] = useState('');
  const selected = accounts.find(a => a.id === selectedId) || accounts[0];
  useEffect(() => { if (selected && params.has('account') && !accounts.some(a => a.id === params.get('account'))) setParams({}, { replace: true }); }, [accounts, params, selected, setParams]);
  const filtered = useMemo(() => transactions.filter(t => t.accountId === selected?.id && (filter === 'ALL' || t.kind === filter) && t.description.toLowerCase().includes(query.toLowerCase())), [transactions, selected?.id, filter, query]);
  if (loading) return <div role="status" aria-label="Loading your accounts" className="space-y-4"><Skeleton className="h-10 w-56"/><Skeleton className="h-52 rounded-3xl"/><Skeleton className="h-72 rounded-3xl"/></div>;
  if (!selected) return <Empty className="rounded-3xl border border-border bg-card py-16"><EmptyHeader><EmptyTitle>No accounts available</EmptyTitle><EmptyDescription>Accounts will appear here once they're opened.</EmptyDescription></EmptyHeader></Empty>;
  const details: [string, string][] = [['Account holder', 'Personal account'], ['Sort code', selected.sortCode], ['Account number', selected.accountNumber], ['Account type', selected.accountType === 'CURRENT' ? 'Current' : 'Savings']];
  return <div className="space-y-6">
    <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Your money</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">My accounts</h1></div><ButtonLink to="/app/transfer" className="h-10 rounded-full px-4"><ArrowLeftRight/>Make a transfer</ButtonLink></div>
    <div className="grid gap-4 md:grid-cols-2">{accounts.map(a => <AccountCard key={a.id} account={a}/>)}</div>
    <Card className="rounded-3xl"><CardHeader><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Account details</p><CardTitle className="mt-1 text-2xl">{selected.name}</CardTitle></div><div className="text-right"><AnimatedMoney value={selected.balance} className="text-2xl font-semibold tabular-nums"/><p className="text-xs text-muted-foreground">Available balance</p></div></div></CardHeader>
      <CardContent className="space-y-5"><dl className="grid gap-4 sm:grid-cols-4">{details.map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-0.5 text-sm font-medium">{v}</dd></div>)}</dl>
        <div><p className="mb-2 text-xs font-medium tracking-widest text-muted-foreground uppercase">Switch account</p><div className="flex flex-wrap gap-2">{accounts.map(a => <button key={a.id} type="button" aria-pressed={selected.id === a.id} onClick={() => setParams({ account: a.id })} className={cn('rounded-full border px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/60', selected.id === a.id ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-muted')}>{a.name}</button>)}</div></div></CardContent></Card>
    <Card className="rounded-3xl"><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-lg">Transaction history</CardTitle><CardDescription>Every little detail, easy to find</CardDescription></div><span className="text-sm text-muted-foreground" aria-live="polite">{filtered.length} transactions</span></div></CardHeader>
      <CardContent><div className="mb-3 flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"/><Input aria-label="Search transactions" placeholder="Search transactions" className="h-10 pl-9" value={query} onChange={e => setQuery(e.target.value)}/></div>
        <NativeSelect aria-label="Transaction type" value={filter} onChange={e => setFilter(e.target.value as typeof filter)} className="sm:w-44"><NativeSelectOption value="ALL">All activity</NativeSelectOption><NativeSelectOption value="CREDIT">Money in</NativeSelectOption><NativeSelectOption value="DEBIT">Money out</NativeSelectOption></NativeSelect></div>
        <TransactionList items={filtered}/></CardContent></Card>
    <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Download className="size-4"/>Only fictional funds are used in this application. <Link to="/app/statements" className="text-primary hover:underline">Download statement</Link></p>
  </div>;
}
