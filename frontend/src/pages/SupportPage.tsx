import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, LifeBuoy } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { demoContent } from '../lib/demo';
import { supportSchema, type SupportForm } from '../lib/validators';
export default function SupportPage() {
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<SupportForm>({ resolver: zodResolver(supportSchema), mode: 'onChange', defaultValues: { topic: '', message: '' } });
  const [sent, setSent] = useState(false);
  return <div className="space-y-6"><div><p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Help centre</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Support</h1></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-3xl"><CardHeader><CardTitle className="text-lg">Frequently asked questions</CardTitle></CardHeader><CardContent><Accordion>{demoContent.faqs.map((f, i) => <AccordionItem key={f.question} value={`faq-${i}`}><AccordionTrigger>{f.question}</AccordionTrigger><AccordionContent>{f.answer}</AccordionContent></AccordionItem>)}</Accordion></CardContent></Card>
      <Card className="rounded-3xl"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><LifeBuoy className="size-5 text-primary"/>Contact support</CardTitle><CardDescription>Support requests are a preview and are not sent anywhere.</CardDescription></CardHeader><CardContent>
        {sent ? <div role="status" className="space-y-2 py-6 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-full bg-warning/15 text-warning"><Check/></span><h2 className="font-semibold">Preview only: nothing was sent</h2><p className="text-sm text-muted-foreground">There's no support inbox connected to this demo. Your message was not stored or delivered.</p><Button variant="outline" className="h-10 rounded-full" onClick={() => setSent(false)}>Write another</Button></div> :
        <form noValidate onSubmit={handleSubmit(() => setSent(true))} className="space-y-4">
          <div><Label htmlFor="topic" className="mb-1.5">Topic</Label><NativeSelect id="topic" className="w-full" aria-invalid={!!errors.topic} {...register('topic')}><NativeSelectOption value="">Choose a topic</NativeSelectOption><NativeSelectOption>Accounts</NativeSelectOption><NativeSelectOption>Payments &amp; transfers</NativeSelectOption><NativeSelectOption>Cards</NativeSelectOption><NativeSelectOption>Security</NativeSelectOption></NativeSelect>{errors.topic && <p role="alert" className="mt-1.5 text-sm text-destructive">{errors.topic.message}</p>}</div>
          <div><Label htmlFor="message" className="mb-1.5">How can we help?</Label><Textarea id="message" rows={5} aria-invalid={!!errors.message} {...register('message')}/>{errors.message && <p role="alert" className="mt-1.5 text-sm text-destructive">{errors.message.message}</p>}<p className="mt-1.5 text-xs text-muted-foreground">Never include passwords, full card numbers or security codes.</p></div>
          <Button type="submit" disabled={!isValid} className="h-11 w-full rounded-full">Submit request</Button></form>}
        <Badge variant="outline" className="mt-4 border-warning/50 text-warning">Demo</Badge></CardContent></Card></div></div>;
}
