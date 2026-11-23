import { useState } from 'react';
import { Fingerprint, Info, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '../context/AuthContext';
import { DEMO_MODE } from '../lib/api';
import { initials } from '../lib/format';
const checks = ['Password hashing on the API', 'Authenticated account access', 'Ownership checks on every account request', 'Idempotent, database-backed transfers'];
export default function SettingsPage() {
  const { session } = useAuth(); const user = session!.user;
  const [prefs, setPrefs] = useState({ alerts: true, marketing: false });
  return <div className="space-y-6"><div><p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Your profile</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Settings &amp; security</h1></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-3xl"><CardHeader><CardTitle className="text-lg">Personal details</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex items-center gap-3"><Avatar className="size-12"><AvatarFallback className="bg-primary/15 font-semibold text-primary">{initials(user.fullName)}</AvatarFallback></Avatar><div><strong>{user.fullName}</strong><p className="text-sm text-muted-foreground">Meridian demo customer</p></div></div><Separator/>
        {[[UserRound, 'Full name', user.fullName], [Mail, 'Email address', user.email], [Fingerprint, 'Profile type', 'Personal banking · Simulation']].map(([Icon, k, v]) => { const I = Icon as typeof Mail; return <div key={k as string} className="flex items-center gap-3 text-sm"><I className="size-4 text-muted-foreground"/><span className="w-28 text-muted-foreground">{k as string}</span><span className="font-medium">{v as string}</span></div>; })}</CardContent></Card>
      <Card className="rounded-3xl"><CardHeader><CardTitle className="text-lg">Preferences</CardTitle><CardDescription>Saved in this browser only (demo)</CardDescription></CardHeader><CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4"><Label htmlFor="p-alerts" className="text-sm">Security and account alerts</Label><Switch id="p-alerts" checked={prefs.alerts} onCheckedChange={v => setPrefs(p => ({ ...p, alerts: v }))}/></div>
        <div className="flex items-center justify-between gap-4"><Label htmlFor="p-marketing" className="text-sm">Product news</Label><Switch id="p-marketing" checked={prefs.marketing} onCheckedChange={v => setPrefs(p => ({ ...p, marketing: v }))}/></div></CardContent></Card>
      <Card className="rounded-3xl lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="size-5 text-success"/>Security overview</CardTitle><CardDescription>This portfolio application demonstrates the building blocks of secure online banking.</CardDescription></CardHeader><CardContent className="space-y-3">
        <ul className="grid gap-2 sm:grid-cols-2">{checks.map(c => <li key={c} className="flex items-center gap-2 text-sm"><ShieldCheck className="size-4 text-success"/>{c}</li>)}</ul>
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><LockKeyhole className="size-4"/>{DEMO_MODE ? 'Demo mode stores fictional account state in your browser.' : 'You are connected to the Spring Boot demo API.'}</p>
        <Badge variant="outline" className="h-auto max-w-full border-warning/50 py-1 text-left whitespace-normal text-warning">Audit log and session list need backend endpoints (not yet available)</Badge></CardContent></Card></div>
    <Alert className="rounded-2xl"><Info/><AlertTitle>This is a portfolio project, not a bank</AlertTitle><AlertDescription>No real account numbers or financial services are provided. Do not submit real banking credentials, payment details or sensitive information.</AlertDescription></Alert></div>;
}
