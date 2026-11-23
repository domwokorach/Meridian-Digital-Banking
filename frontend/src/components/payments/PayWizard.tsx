import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, FlaskConical } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress';
import { useBank } from '../../context/BankContext';
import { demoContent } from '../../lib/demo';
import { maskedAccount, money } from '../../lib/format';
import { paymentSchema, type PaymentForm } from '../../lib/validators';
const steps = ['Payee & amount', 'Review', 'Result'];
/** Payments to other people need a payment provider and backend endpoint that do not exist yet. This wizard rehearses the flow and always ends in an honest "not sent" result. */
export default function PayWizard() {
  const { accounts } = useBank();
  const [step, setStep] = useState(0);
  const { register, handleSubmit, getValues, formState: { errors, isValid } } = useForm<PaymentForm>({ resolver: zodResolver(paymentSchema), mode: 'onChange', defaultValues: { beneficiaryId: '', fromAccountId: accounts[0]?.id ?? '', amount: '', reference: '' } });
  const values = step > 0 ? getValues() : null;
  const payee = demoContent.beneficiaries.find(b => b.id === values?.beneficiaryId);
  return <div>
    <h2 className="text-xl font-semibold">Pay someone</h2>
    <Alert className="mt-3 rounded-2xl border-warning/40 bg-warning/10"><FlaskConical className="text-warning"/><AlertTitle>Sandbox preview</AlertTitle><AlertDescription>No payment provider is connected. You can rehearse the flow, but no money will be sent.</AlertDescription></Alert>
    <Progress value={((step + 1) / steps.length) * 100} aria-label="Payment progress" className="mt-5 gap-0"><ProgressTrack className="h-1.5"><ProgressIndicator className="rounded-full"/></ProgressTrack></Progress>
    <p className="mt-2 text-xs text-muted-foreground">Step {step + 1} of {steps.length} · {steps[step]}</p>
    <AnimatePresence mode="wait"><motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .2 }} className="mt-5">
      {step === 0 && <form noValidate onSubmit={handleSubmit(() => setStep(1))} className="space-y-5">
        <div><Label htmlFor="payee" className="mb-1.5">Payee</Label><NativeSelect id="payee" className="w-full" aria-invalid={!!errors.beneficiaryId} {...register('beneficiaryId')}><NativeSelectOption value="">Choose a payee</NativeSelectOption>{demoContent.beneficiaries.map(b => <NativeSelectOption key={b.id} value={b.id}>{b.name} — {maskedAccount(b.accountNumber)}</NativeSelectOption>)}</NativeSelect>{errors.beneficiaryId && <p role="alert" className="mt-1.5 text-sm text-destructive">{errors.beneficiaryId.message}</p>}</div>
        <div><Label htmlFor="pay-from" className="mb-1.5">Pay from</Label><NativeSelect id="pay-from" className="w-full" {...register('fromAccountId')}>{accounts.map(a => <NativeSelectOption key={a.id} value={a.id}>{a.name} — {money(a.balance)}</NativeSelectOption>)}</NativeSelect></div>
        <div><Label htmlFor="pay-amount" className="mb-1.5">Amount</Label><Input id="pay-amount" inputMode="decimal" placeholder="0.00" className="h-11" aria-invalid={!!errors.amount} {...register('amount')}/>{errors.amount && <p role="alert" className="mt-1.5 text-sm text-destructive">{errors.amount.message}</p>}</div>
        <div><Label htmlFor="pay-ref" className="mb-1.5">Reference</Label><Input id="pay-ref" maxLength={18} className="h-11" aria-invalid={!!errors.reference} {...register('reference')}/>{errors.reference && <p role="alert" className="mt-1.5 text-sm text-destructive">{errors.reference.message}</p>}</div>
        <Button type="submit" disabled={!isValid} className="h-11 w-full rounded-full">Review payment <ArrowRight/></Button></form>}
      {step === 1 && values && <div className="space-y-4"><dl className="space-y-3 rounded-2xl bg-secondary p-4 text-sm">{[['Payee', payee?.name], ['Sort code / account', `${payee?.sortCode} · ${maskedAccount(payee?.accountNumber ?? '')}`], ['Amount', money(Number(values.amount))], ['Reference', values.reference]].map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
        <div className="flex gap-2"><Button variant="outline" className="h-11 flex-1 rounded-full" onClick={() => setStep(0)}>Back</Button><Button className="h-11 flex-1 rounded-full" onClick={() => setStep(2)}>Finish rehearsal</Button></div></div>}
      {step === 2 && <div className="space-y-4 text-center"><span className="mx-auto flex size-14 items-center justify-center rounded-full bg-warning/15 text-warning"><FlaskConical className="size-7"/></span><h3 className="text-lg font-semibold">Nothing was sent</h3><p className="text-sm text-muted-foreground">This was a sandbox rehearsal. Your balances are unchanged and no payment was created. Real payments need an approved payment provider and a backend endpoint.</p><Button variant="outline" className="h-10 rounded-full" onClick={() => setStep(0)}>Start again</Button></div>}
    </motion.div></AnimatePresence>
  </div>;
}
