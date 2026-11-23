import { useState, type FormEvent } from 'react';
import { Check, Download, FileDown, Info, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { useBank } from '../context/BankContext';
import { api } from '../lib/api';
import { isoDate, maskedAccount } from '../lib/format';
export default function StatementsPage() {
  const { accounts, loading } = useBank();
  const [account, setAccount] = useState('');
  const [from, setFrom] = useState(isoDate(90));
  const [to, setTo] = useState(isoDate());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const selected = account || accounts[0]?.id;
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setDone(false);
    if (from > to) { setError('The start date must be before the end date.'); return; }
    setBusy(true);
    try {
      const blob = await api.statement(selected, from, to);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `meridian-statement-${from}-to-${to}.csv`;
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); setDone(true);
    } catch (ex) { setError(ex instanceof Error ? ex.message : 'Could not download statement'); }
    finally { setBusy(false); }
  };
  if (loading) return <div role="status" aria-label="Preparing statements" className="space-y-4"><Skeleton className="h-10 w-64"/><Skeleton className="h-80 rounded-3xl"/></div>;
  return <div className="space-y-6"><div><p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Your documents</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Statements &amp; downloads</h1></div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card className="rounded-3xl"><CardHeader><CardTitle className="text-lg">Download a statement</CardTitle><CardDescription>Get a CSV record of your account transactions.</CardDescription></CardHeader>
        <CardContent><form onSubmit={submit} className="space-y-5">
          <div><Label htmlFor="stmt-account" className="mb-1.5">Choose an account</Label><NativeSelect id="stmt-account" className="w-full" value={selected} onChange={e => setAccount(e.target.value)}>{accounts.map(a => <NativeSelectOption key={a.id} value={a.id}>{a.name} · {maskedAccount(a.accountNumber)}</NativeSelectOption>)}</NativeSelect></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="stmt-from" className="mb-1.5">From</Label><Input id="stmt-from" type="date" value={from} onChange={e => setFrom(e.target.value)} max={to} required className="h-10"/></div><div><Label htmlFor="stmt-to" className="mb-1.5">To</Label><Input id="stmt-to" type="date" value={to} onChange={e => setTo(e.target.value)} max={isoDate()} min={from} required className="h-10"/></div></div>
          <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4"><FileDown className="size-6 text-primary"/><div className="flex-1 text-sm"><strong className="block">CSV statement</strong><span className="text-muted-foreground">Opens in Excel, Google Sheets and other spreadsheet apps</span></div><span className="rounded-md bg-card px-2 py-1 text-xs font-medium">.CSV</span></div>
          {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          {done && <p className="flex items-center gap-2 text-sm text-success"><Check className="size-4"/>Your statement has been downloaded.</p>}
          <Button type="submit" disabled={busy || !accounts.length} className="h-11 w-full rounded-full"><Download/>{busy ? 'Preparing file…' : 'Download statement'}</Button></form></CardContent></Card>
      <Card className="rounded-3xl"><CardContent className="space-y-3 text-sm"><h2 className="text-base font-semibold">For your records</h2><p className="text-muted-foreground">Choose an account and a date range to download itemised transactions, dates, amounts and running balances.</p><p className="flex gap-2 text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0"/>This portfolio project exports CSV statements; they are not official bank documents.</p><p className="flex gap-2 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0"/>Statements include only your own account data.</p></CardContent></Card>
    </div></div>;
}
