import { z } from 'zod';
const amountText = z.string().trim().regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount with at most two decimals').refine(v => Number(v) >= 0.01, 'Enter at least £0.01').refine(v => Number(v) <= 50000, 'The limit is £50,000 per transfer');
/** Client-side checks give fast feedback only; the backend re-validates every transfer. */
export const transferSchema = z.object({
  fromAccountId: z.string().min(1, 'Choose an account to pay from'),
  toAccountId: z.string().min(1, 'Choose an account to pay into'),
  amount: amountText,
  reference: z.string().max(120, 'Keep the reference under 120 characters'),
}).refine(v => v.fromAccountId !== v.toAccountId, { path: ['toAccountId'], message: 'Choose two different accounts' });
export type TransferForm = z.infer<typeof transferSchema>;
export const paymentSchema = z.object({
  beneficiaryId: z.string().min(1, 'Choose who you are paying'),
  fromAccountId: z.string().min(1, 'Choose an account to pay from'),
  amount: amountText,
  reference: z.string().trim().min(1, 'Add a reference the recipient will see').max(18, 'References are limited to 18 characters'),
});
export type PaymentForm = z.infer<typeof paymentSchema>;
export const supportSchema = z.object({
  topic: z.string().min(1, 'Choose a topic'),
  message: z.string().trim().min(10, 'Please give us a little more detail').max(1000),
});
export type SupportForm = z.infer<typeof supportSchema>;
