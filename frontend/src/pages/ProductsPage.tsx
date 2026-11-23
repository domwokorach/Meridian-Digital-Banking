import { CreditCard, PiggyBank, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
const products = [
  { icon: Wallet, name: 'Everyday account', text: 'A current account for day-to-day spending and bills.', to: '/app/accounts' },
  { icon: PiggyBank, name: 'Rainy day savings', text: 'Set money aside and watch goals grow.', to: '/app/savings' },
  { icon: CreditCard, name: 'Cards', text: 'Debit and credit cards with freeze, limits and virtual options.', to: '/app/cards' },
];
export default function ProductsPage() {
  return <div className="space-y-6"><div><p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Products</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Products &amp; services</h1></div>
    <Badge variant="outline" className="h-auto max-w-full border-warning/50 py-1 text-left whitespace-normal text-warning">Fictional products · applications are not available</Badge>
    <div className="grid gap-4 md:grid-cols-3">{products.map(p => <Card key={p.name} className="rounded-3xl"><CardHeader><span className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary"><p.icon/></span><CardTitle>{p.name}</CardTitle><CardDescription>{p.text}</CardDescription></CardHeader><CardContent><ButtonLink to={p.to} variant="secondary" className="h-9 rounded-full px-4">Open</ButtonLink></CardContent></Card>)}</div></div>;
}
