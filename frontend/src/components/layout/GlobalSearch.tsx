import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, CreditCard, FileText, Home, LifeBuoy, PiggyBank, Search, Settings2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useBank } from '../../context/BankContext';
const pages = [
  { to: '/app', label: 'Home', icon: Home }, { to: '/app/transfer', label: 'Payments & Transfers', icon: ArrowLeftRight },
  { to: '/app/accounts', label: 'Accounts', icon: Wallet }, { to: '/app/cards', label: 'Cards', icon: CreditCard },
  { to: '/app/savings', label: 'Savings goals', icon: PiggyBank }, { to: '/app/statements', label: 'Statements', icon: FileText },
  { to: '/app/support', label: 'Support', icon: LifeBuoy }, { to: '/app/settings', label: 'Profile & security', icon: Settings2 },
];
export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { accounts, transactions } = useBank();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(o => !o); } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  const go = (to: string) => { setOpen(false); navigate(to); };
  return <>
    <Button variant="outline" size="lg" onClick={() => setOpen(true)} aria-label="Search" className="hidden h-10 w-56 justify-start gap-2 rounded-full px-3.5 text-muted-foreground lg:inline-flex xl:w-72"><Search className="size-4"/><span className="flex-1 text-left">Search</span><kbd className="rounded border border-border px-1.5 text-[10px]">⌘K</kbd></Button>
    <Button variant="ghost" size="icon-lg" onClick={() => setOpen(true)} aria-label="Search" className="lg:hidden"><Search className="size-5"/></Button>
    <CommandDialog open={open} onOpenChange={setOpen} title="Search Meridian" description="Jump to a page, account or transaction">
      <CommandInput placeholder="Search pages, accounts and transactions…"/>
      <CommandList>
        <CommandEmpty>Nothing matches that search.</CommandEmpty>
        <CommandGroup heading="Pages">{pages.map(p => <CommandItem key={p.to} value={p.label} onSelect={() => go(p.to)}><p.icon/>{p.label}</CommandItem>)}</CommandGroup>
        {accounts.length > 0 && <CommandGroup heading="Accounts">{accounts.map(a => <CommandItem key={a.id} value={`account ${a.name}`} onSelect={() => go(`/app/accounts?account=${a.id}`)}><Wallet/>{a.name}</CommandItem>)}</CommandGroup>}
        {transactions.length > 0 && <CommandGroup heading="Recent transactions">{transactions.slice(0, 8).map(t => <CommandItem key={t.id} value={`transaction ${t.description} ${t.id}`} onSelect={() => go(`/app/accounts?account=${t.accountId}`)}><FileText/>{t.description}</CommandItem>)}</CommandGroup>}
      </CommandList>
    </CommandDialog>
  </>;
}
