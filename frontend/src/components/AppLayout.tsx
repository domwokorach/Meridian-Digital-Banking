import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowLeftRight, Bell, ChevronDown, CircleHelp, CreditCard, FileText, LayoutDashboard, LogOut, Menu, Settings2, ShieldCheck, X } from 'lucide-react';
import Brand from './Brand';
import { useAuth } from '../context/AuthContext';
import { BankProvider } from '../context/BankContext';
import { DEMO_MODE } from '../lib/api';
import { firstName, initials } from '../lib/format';
const links = [
  { to: '/app', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/app/accounts', icon: CreditCard, label: 'My accounts' },
  { to: '/app/transfer', icon: ArrowLeftRight, label: 'Move money' },
  { to: '/app/statements', icon: FileText, label: 'Statements' },
  { to: '/app/settings', icon: Settings2, label: 'Settings' },
];
export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const user = session!.user;
  const signOut = () => { logout(); navigate('/'); };
  return <BankProvider><div className="banking-app">
    <aside className={`app-sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><Brand /><button className="sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X/></button></div>
      <div className="sidebar-user"><span className="avatar avatar-sidebar">{initials(user.fullName)}</span><div><strong>{user.fullName}</strong><span>Personal banking <ChevronDown size={12}/></span></div></div>
      <div className="sidebar-label">YOUR BANKING</div>
      <nav className="sidebar-nav" aria-label="Your banking">
        {links.map(({ to, icon: Icon, label, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`} onClick={() => setMobileOpen(false)}><Icon size={19}/>{label}</NavLink>)}
      </nav>
      <div className="sidebar-bottom"><div className="security-note"><ShieldCheck size={21}/><div><strong>Your space, protected</strong><span>Private simulated banking</span></div></div>
        <NavLink to="/" className="sidebar-link sidebar-back"><ArrowLeft size={18}/> Back to home</NavLink>
        <button className="sidebar-link logout-link" onClick={signOut}><LogOut size={18}/> Sign out</button>
      </div>
    </aside>
    {mobileOpen && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)}/>}
    <div className="app-workspace">
      <header className="workspace-header"><div className="workspace-left"><button className="mobile-menu-button app-menu-button" aria-label="Open menu" onClick={() => setMobileOpen(true)}><Menu size={24}/></button><span className="workspace-greeting">Good to see you, <strong>{firstName(user.fullName)}</strong> <span className="wave">✳</span></span></div>
        <div className="workspace-actions">{DEMO_MODE && <span className="demo-pill"><span/> DEMO MODE</span>}
          <span className="workspace-help" title="Fictional banking portfolio demo"><CircleHelp size={19}/></span><span className="workspace-help" title="Notifications"><Bell size={19}/></span><span className="avatar avatar-header">{initials(user.fullName)}</span>
        </div></header>
      <main className="app-main"><Outlet /></main>
      <footer className="workspace-footer">© {new Date().getFullYear()} Meridian. Fictional banking application · For portfolio demonstration only · No real money.</footer>
    </div>
  </div></BankProvider>;
}
