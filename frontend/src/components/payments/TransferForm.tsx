import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, CircleCheck, LockKeyhole } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { toast } from '@/components/ui/toast';
import { useBank } from '../../context/BankContext';
import { api } from '../../lib/api';
import { maskedAccount, money } from '../../lib/format';
import { transferSchema, type TransferForm as Values } from '../../lib/validators';
const Err = ({ id, message }: { id: string; message?: string }) => message ? <p id={id} role="alert" className="mt-1.5 text-sm text-destructive">{message}</p> : null;
export default function TransferForm() {
  const { accounts, refresh } = useBank();
  const { register, handleSubmit, watch, formState: { errors, isValid }, reset } = useForm<Values>({
    resolver: zodResolver(transferSchema), mode: 'onChange',
    defaultValues: { fromAccountId: accounts[0]?.id ?? '', toAccountId: accounts[1]?.id ?? accounts[0]?.id ?? '', amount: '', reference: 'Monthly savings' },
  });
  const v = watch();
  const from = accounts.find(a => a.id === v.fromAccountId);
  const to = accounts.find(a => a.id === v.toAccountId);
  const amount = Number(v.amount);
  const overdrawn = !!from && Number.isFinite(amount) && amount > from.balance;
  const [review, setReview] = useState<Values | null>(null);
  const [requestId, setRequestId] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ amount: number; to: string } | null>(null);
  // A fresh id per review dialog makes a double-click or retry idempotent on the server.
  const openReview = handleSubmit(values => { setError(''); setRequestId(crypto.randomUUID()); setReview(values); });
  const confirm = async () => {
    if (!review || sending) return;
    setSending(true); setError('');
    try {
      await api.transfer({ requestId, fromAccountId: review.fromAccountId, toAccountId: review.toAccountId, amount: Number(review.amount), reference: review.reference });
      await refresh();
      setDone({ amount: Number(review.amount), to: accounts.find(a => a.id === review.toAccountId)?.name ?? 'account' });
      toast.add({ title: 'Transfer complete', description: `${money(Number(review.amount))} moved`, type: 'success' });
      setReview(null); reset({ ...review, amount: '' });
    } catch (e) { setError(e instanceof Error ? e.message : 'Transfer could not be completed'); }
    finally { setSending(false); }
  };
  const options = useMemo(() => accounts.map(a => <NativeSelectOption key={a.id} value={a.id}>{a.name} — {maskedAccount(a.accountNumber)}</NativeSelectOption>), [accounts]);
  if (done) return <motion.div initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 py-8 text-center">
    <span className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success"><Check className="size-8"/></span>
    <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Transfer complete</p><h2 className="text-2xl font-semibold">Money on the move</h2>
    <p className="text-muted-foreground">You transferred <strong className="text-foreground">{money(done.amount)}</strong> to <strong className="text-foreground">{done.to}</strong>.</p>
    <p className="flex items-center gap-1.5 text-sm text-success"><CircleCheck className="size-4"/>Both balances have been updated.</p>
    <div className="mt-2 flex gap-2"><Button className="h-10 rounded-full px-4" onClick={() => setDone(null)}>Make another transfer</Button><ButtonLink to="/app/accounts" variant="ghost" className="h-10 rounded-full px-4">View activity</ButtonLink></div></motion.div>;
  return <>
    <h2 className="text-xl font-semibold">Make a transfer</h2><p className="mt-1 mb-6 text-sm text-muted-foreground">Move money between your own Meridian accounts.</p>
    <form onSubmit={openReview} noValidate className="space-y-5">
      <div><Label htmlFor="from" className="mb-1.5">From account</Label><NativeSelect id="from" className="w-full" {...register('fromAccountId')}>{options}</NativeSelect>
        <p className="mt-1.5 text-sm text-muted-foreground">Available balance <strong className="text-foreground tabular-nums">{from ? money(from.balance) : '—'}</strong></p></div>
      <div><Label htmlFor="to" className="mb-1.5">To account</Label><NativeSelect id="to" className="w-full" aria-describedby="to-err" aria-invalid={!!errors.toAccountId} {...register('toAccountId')}>{options}</NativeSelect><Err id="to-err" message={errors.toAccountId?.message}/></div>
      <div><Label htmlFor="amount" className="mb-1.5">Amount</Label><div className="relative"><span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">£</span><Input id="amount" inputMode="decimal" placeholder="0.00" autoComplete="off" className="h-11 pl-7 text-base" aria-describedby="amount-err" aria-invalid={!!errors.amount || overdrawn} {...register('amount')}/></div>
        <Err id="amount-err" message={errors.amount?.message ?? (overdrawn ? 'This exceeds your available balance.' : undefined)}/></div>
      <div><Label htmlFor="reference" className="mb-1.5">Reference <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="reference" maxLength={120} placeholder="What's this transfer for?" className="h-11" {...register('reference')}/></div>
      <Button type="submit" disabled={!isValid || overdrawn || !to} className="h-11 w-full rounded-full text-base">Review transfer <ArrowRight/></Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><LockKeyhole className="size-3.5"/>Every transfer is re-checked by the server before it is applied.</p>
    </form>
    <Dialog open={!!review} onOpenChange={o => { if (!o && !sending) setReview(null); }}>
      <DialogContent className="rounded-3xl sm:max-w-md"><DialogHeader><DialogTitle>Confirm your transfer</DialogTitle><DialogDescription>Check the details. This will move money between your accounts.</DialogDescription></DialogHeader>
        {review && <dl className="space-y-3 rounded-2xl bg-secondary p-4 text-sm">{[['From', from?.name], ['To', accounts.find(a => a.id === review.toAccountId)?.name], ['Amount', money(Number(review.amount))], ['Reference', review.reference || 'Between my accounts']].map(([k, val]) => <div key={k} className="flex justify-between gap-4"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{val}</dd></div>)}</dl>}
        {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <DialogFooter><Button variant="outline" className="h-10 rounded-full" disabled={sending} onClick={() => setReview(null)}>Back</Button><Button className="h-10 rounded-full" disabled={sending} onClick={() => void confirm()}>{sending ? 'Processing…' : 'Confirm transfer'}</Button></DialogFooter>
      </DialogContent></Dialog>
  </>;
}
