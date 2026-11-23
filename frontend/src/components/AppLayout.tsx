import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGroup, MotionConfig, motion } from 'motion/react';
import { LogOut, Menu, Moon, Settings2, ShieldCheck, Sun, FileText } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import BrandLogo from './layout/BrandLogo';
import GlobalSearch from './layout/GlobalSearch';
import NotificationsPopover from './layout/NotificationsPopover';
import { useAuth } from '../context/AuthContext';
import { BankProvider } from '../context/BankContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ThemeProvider, useTheme } from '../hooks/use-theme';
import { DEMO_MODE } from '../lib/api';
import { initials } from '../lib/format';
import { motionTiming } from '../lib/design-tokens';
const links = [
  { to: '/app', label: 'Home', end: true },
  { to: '/app/transfer', label: 'Payments & Transfers' },
  { to: '/app/accounts', label: 'Accounts' },
  { to: '/app/cards', label: 'Cards' },
  { to: '/app/products', label: 'Products' },
  { to: '/app/support', label: 'Support' },
];
function Shell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = session!.user;
  const signOut = () => { logout(); navigate('/'); };
  return <div className="meridian-app flex min-h-screen flex-col bg-background text-foreground">
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Skip to content</a>
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Open menu" onClick={() => setMobileOpen(true)}><Menu className="size-5"/></Button>
        <BrandLogo/>
        <nav aria-label="Primary" className="ml-6 hidden items-center gap-1 lg:flex">
          <LayoutGroup id="primary-nav">{links.map(l => <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => cn('relative rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/60', isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {({ isActive }) => <>{isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-secondary" transition={{ type: 'spring', stiffness: 400, damping: 34 }}/>}{l.label}</>}
          </NavLink>)}</LayoutGroup>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          {DEMO_MODE && <Badge variant="outline" className="hidden border-warning/50 text-warning sm:inline-flex">Demo mode</Badge>}
          <GlobalSearch/>
          <NotificationsPopover/>
          <Button variant="ghost" size="icon-lg" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>{theme === 'dark' ? <Sun className="size-5"/> : <Moon className="size-5"/>}</Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="h-10 gap-2 rounded-full px-1.5" aria-label="Account menu"/>}><Avatar><AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">{initials(user.fullName)}</AvatarFallback></Avatar></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-2xl">
              <DropdownMenuGroup><DropdownMenuLabel className="px-2 py-2"><span className="block text-sm font-semibold text-foreground">{user.fullName}</span><span className="block text-xs font-normal text-muted-foreground">{user.email}</span></DropdownMenuLabel></DropdownMenuGroup>
              <DropdownMenuSeparator/>
              <DropdownMenuItem render={<NavLink to="/app/settings"/>}><Settings2/>Profile & security</DropdownMenuItem>
              <DropdownMenuItem render={<NavLink to="/app/statements"/>}><FileText/>Statements</DropdownMenuItem>
              <DropdownMenuSeparator/>
              <DropdownMenuItem onClick={signOut}><LogOut/>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-[18rem] max-w-[85vw] bg-card p-0">
        <SheetHeader className="border-b border-border p-4"><SheetTitle>Menu</SheetTitle><SheetDescription className="sr-only">Main navigation</SheetDescription></SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col gap-1 p-3">{links.map(l => <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setMobileOpen(false)} className={({ isActive }) => cn('rounded-xl px-3 py-3 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/60', isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-muted')}>{l.label}</NavLink>)}</nav>
        <div className="mt-auto border-t border-border p-3"><Button variant="outline" className="h-11 w-full justify-start gap-2 rounded-xl" onClick={signOut}><LogOut/>Sign out</Button></div>
      </SheetContent>
    </Sheet>
    <motion.main id="main" key={pathname} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: motionTiming.panel, ease: 'easeOut' }}><Outlet/></motion.main>
    <footer className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground"><ShieldCheck className="mr-1.5 inline size-3.5 align-[-2px]"/>© {new Date().getFullYear()} Meridian. Fictional banking application · For portfolio demonstration only · No real money.</footer>
  </div>;
}
export default function AppLayout() {
  return <ThemeProvider><MotionConfig reducedMotion="user"><TooltipProvider><BankProvider><NotificationProvider><Toaster><Shell/></Toaster></NotificationProvider></BankProvider></TooltipProvider></MotionConfig></ThemeProvider>;
}
