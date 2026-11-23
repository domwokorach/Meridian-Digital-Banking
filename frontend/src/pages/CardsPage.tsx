import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Eye, Plus, Snowflake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import BankCard, { variantName } from '../components/cards/BankCard';
import { useAuth } from '../context/AuthContext';
import { demoContent } from '../lib/demo';
import { money } from '../lib/format';
import type { DemoCard } from '../lib/types';
type CardSettings = Partial<{ frozen: boolean; limit: number; online: boolean; contactless: boolean }>;
type Settings = Record<string, CardSettings>;
const KEY = 'meridian_demo_card_settings_v1';
const load = (): Settings => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
/** Card controls are demo-only: saved in this browser, never sent to a card processor. */
export default function CardsPage() {
  const { session } = useAuth();
  const base = demoContent.cards(session!.user.fullName);
  const [settings, setSettings] = useState<Settings>(load);
  const [selectedId, setSelectedId] = useState(base[0].id);
  const [flipped, setFlipped] = useState(false);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* storage unavailable */ } }, [settings]);
  const cards: DemoCard[] = base.map(c => ({ ...c, frozen: settings[c.id]?.frozen ?? c.frozen, monthlyLimit: settings[c.id]?.limit ?? c.monthlyLimit }));
  const card = cards.find(c => c.id === selectedId)!;
  const s = { online: true, contactless: true, ...settings[card.id] };
  const patch = (p: CardSettings) => setSettings(all => ({ ...all, [card.id]: { ...all[card.id], ...p } }));
  const toggleFreeze = (frozen: boolean) => { patch({ frozen }); toast.add({ title: frozen ? 'Card frozen' : 'Card unfrozen', description: `${card.label} ending ${card.last4} (demo only)`, type: frozen ? 'warning' : 'success' }); };
  return <div className="space-y-6">
    <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Cards</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Your cards</h1></div>
      <Button variant="outline" className="h-10 rounded-full px-4" onClick={() => toast.add({ title: 'Virtual cards are a preview', description: 'Creating new virtual cards needs a card-issuing backend, which is not connected.' })}><Plus/>New virtual card</Button></div>
    <Badge variant="outline" className="h-auto max-w-full border-warning/50 py-1 text-left whitespace-normal text-warning">Demo cards · fictional bank · masked numbers only</Badge>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <div className="space-y-4"><motion.div key={card.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .28 }}><BankCard card={card} flipped={flipped} onFlip={setFlipped}/></motion.div>
        <p className="text-center text-xs text-muted-foreground">Select the card to flip it</p>
        <ul className="grid grid-cols-2 gap-3" aria-label="Choose a card">{cards.map(c => <li key={c.id}><button type="button" aria-pressed={c.id === selectedId} onClick={() => { setSelectedId(c.id); setFlipped(false); }} className={cn('flex w-full items-center gap-3 rounded-2xl border p-3 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/60', c.id === selectedId ? 'border-primary bg-primary/10' : 'border-border hover:bg-secondary')}><CreditCard className="size-5 shrink-0 text-primary"/><span className="min-w-0 text-sm"><span className="block truncate font-medium">{c.label}</span><span className="block text-xs text-muted-foreground">{variantName(c.variant)} · {c.last4}{c.frozen ? ' · Frozen' : ''}</span></span></button></li>)}</ul></div>
      <Card className="rounded-3xl"><CardHeader><CardTitle className="text-lg">{card.label}</CardTitle><CardDescription>{card.kind === 'DEBIT' ? 'Debit' : 'Credit'} card{card.virtual ? ' · Virtual' : ''} ending {card.last4}</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4"><div><Label htmlFor="freeze" className="flex items-center gap-2 text-sm font-medium"><Snowflake className="size-4 text-cyan"/>Freeze card</Label><p className="text-xs text-muted-foreground">Temporarily block all payments. You can unfreeze at any time.</p></div><Switch id="freeze" checked={card.frozen} onCheckedChange={toggleFreeze}/></div>
          <div className="flex items-center justify-between gap-4"><div><Label htmlFor="online" className="text-sm font-medium">Online payments</Label><p className="text-xs text-muted-foreground">Allow purchases on websites and apps.</p></div><Switch id="online" checked={s.online} onCheckedChange={v => patch({ online: v })}/></div>
          <div className="flex items-center justify-between gap-4"><div><Label htmlFor="tap" className="text-sm font-medium">Contactless</Label><p className="text-xs text-muted-foreground">Tap to pay in shops.</p></div><Switch id="tap" checked={s.contactless} onCheckedChange={v => patch({ contactless: v })}/></div>
          <div><div className="mb-3 flex items-baseline justify-between"><Label htmlFor="limit-slider" className="text-sm font-medium">Monthly spending limit</Label><span className="font-semibold tabular-nums">{money(card.monthlyLimit)}</span></div>
            <Slider id="limit-slider" aria-label="Monthly spending limit" min={100} max={15000} step={100} value={[card.monthlyLimit]} onValueChange={v => patch({ limit: Array.isArray(v) ? v[0] : v })}/></div>
          <Dialog><DialogTrigger render={<Button variant="secondary" className="h-10 rounded-full px-4"/>}><Eye/>Card details</DialogTrigger>
            <DialogContent className="rounded-3xl sm:max-w-md"><DialogHeader><DialogTitle>{card.label}</DialogTitle><DialogDescription>For your security the full number and security code are never shown in this demo.</DialogDescription></DialogHeader>
              <dl className="space-y-3 rounded-2xl bg-secondary p-4 text-sm">{[['Card number', `•••• •••• •••• ${card.last4}`], ['Cardholder', card.holder], ['Expires', card.expiry], ['Security code', '•••'], ['Status', card.frozen ? 'Frozen' : 'Active'], ['Type', `${card.kind === 'DEBIT' ? 'Debit' : 'Credit'}${card.virtual ? ' (virtual)' : ''}`]].map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl></DialogContent></Dialog>
        </CardContent></Card>
    </div></div>;
}
