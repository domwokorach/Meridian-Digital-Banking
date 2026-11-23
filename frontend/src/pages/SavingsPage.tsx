import { PiggyBank } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import AnimatedMoney from '../components/animations/AnimatedMoney';
import { useBank } from '../context/BankContext';
import { demoContent } from '../lib/demo';
import { money, sumMoney } from '../lib/format';
import { goalProgress } from '../lib/insights';
export default function SavingsPage() {
  const { accounts, loading } = useBank();
  const savingsAccounts = accounts.filter(a => a.accountType === 'SAVINGS');
  const balance = sumMoney(savingsAccounts.map(a => a.balance));
  if (loading) return <div role="status" aria-label="Loading savings" className="space-y-4"><Skeleton className="h-10 w-56"/><Skeleton className="h-40 rounded-3xl"/></div>;
  return <div className="space-y-6"><div><p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Savings</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Savings &amp; goals</h1></div>
    <Card className="rounded-3xl"><CardContent className="flex items-center gap-4"><span className="flex size-12 items-center justify-center rounded-2xl bg-success/15 text-success"><PiggyBank/></span><div><p className="text-sm text-muted-foreground">Total in savings accounts</p><AnimatedMoney value={balance} className="text-3xl font-semibold tabular-nums"/></div></CardContent></Card>
    {savingsAccounts.length === 0 && <p className="text-sm text-muted-foreground">You don't have a savings account yet, so goals can't be funded.</p>}
    <Badge variant="outline" className="h-auto max-w-full border-warning/50 py-1 text-left whitespace-normal text-warning">Demo data · goals are sample targets funded from your savings balance</Badge>
    <div className="grid gap-4 md:grid-cols-3">{demoContent.goals.map(g => { const { saved, percent } = goalProgress(g, balance); return <Card key={g.id} className="rounded-3xl"><CardHeader><CardTitle>{g.name}</CardTitle><CardDescription>Target {money(g.target)} by {new Date(g.targetDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</CardDescription></CardHeader>
      <CardContent><p className="text-2xl font-semibold tabular-nums">{money(saved)}</p><Progress value={percent} aria-label={`${g.name} progress`} className="mt-3 gap-0"><ProgressTrack className="h-2"><ProgressIndicator className="rounded-full bg-gradient-to-r from-primary to-cyan"/></ProgressTrack></Progress><p className="mt-2 text-xs text-muted-foreground">{percent}% of target · {money(Math.max(0, g.target - saved))} to go</p></CardContent></Card>; })}</div></div>;
}
