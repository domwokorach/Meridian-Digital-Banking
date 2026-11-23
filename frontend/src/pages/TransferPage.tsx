import { useSearchParams } from 'react-router-dom';
import { Check, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PayWizard from '../components/payments/PayWizard';
import TransferForm from '../components/payments/TransferForm';
import { useBank } from '../context/BankContext';
export default function TransferPage() {
  const { loading, accounts } = useBank();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'pay' ? 'pay' : 'transfer';
  return <div className="space-y-6">
    <div><p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Move money</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Payments &amp; transfers</h1></div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card className="rounded-3xl"><CardContent className="px-5 py-2 sm:px-8">
        {loading ? <div role="status" aria-label="Loading your accounts" className="space-y-4 py-4"><Skeleton className="h-8 w-48"/><Skeleton className="h-11"/><Skeleton className="h-11"/><Skeleton className="h-11"/></div> :
          <Tabs value={tab} onValueChange={v => setParams(v === 'pay' ? { tab: 'pay' } : {})}>
            <TabsList className="mb-6"><TabsTrigger value="transfer">Between my accounts</TabsTrigger><TabsTrigger value="pay">Pay someone</TabsTrigger></TabsList>
            <TabsContent value="transfer">{accounts.length < 2 ? <p className="py-6 text-sm text-muted-foreground">You need at least two accounts to make a transfer.</p> : <TransferForm key={accounts.map(a => a.id).join()}/>}</TabsContent>
            <TabsContent value="pay"><PayWizard/></TabsContent>
          </Tabs>}
      </CardContent></Card>
      <aside className="space-y-4"><Card className="rounded-3xl"><CardContent className="space-y-3 text-sm"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary"><ShieldCheck/></span><h2 className="text-base font-semibold">A safe space to explore</h2><p className="text-muted-foreground">Move fictional money between your own accounts and see transactions appear immediately.</p>
        {['No real payments', 'Instant balance updates', 'Built-in duplicate protection'].map(t => <p key={t} className="flex items-center gap-2"><Check className="size-4 text-success"/>{t}</p>)}</CardContent></Card></aside>
    </div>
  </div>;
}
