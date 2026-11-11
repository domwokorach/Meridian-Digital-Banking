import { Check, Fingerprint, Info, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_MODE } from '../lib/api';
import { initials } from '../lib/format';
export default function SettingsPage() {
  const { session } = useAuth(); const user = session!.user;
  return <div><div className="page-top"><div><div className="page-kicker">YOUR PROFILE</div><h1>Settings & security</h1><p>A little more about your account and how it works.</p></div></div>
    <div className="settings-grid"><section className="surface-panel settings-profile"><h2>Personal details</h2><div className="settings-person"><span className="avatar avatar-settings">{initials(user.fullName)}</span><div><strong>{user.fullName}</strong><p>Meridian demo customer</p></div></div><div className="settings-line"><UserRound size={19}/><div><span>Full name</span><strong>{user.fullName}</strong></div></div><div className="settings-line"><Mail size={19}/><div><span>Email address</span><strong>{user.email}</strong></div></div><div className="settings-line"><Fingerprint size={19}/><div><span>Profile type</span><strong>Personal banking · Simulation</strong></div></div></section>
    <section className="surface-panel settings-security"><h2>Security overview</h2><div className="security-emblem"><ShieldCheck size={34}/></div><h3>Designed with care.</h3><p>This portfolio application demonstrates the building blocks of secure online banking.</p><div className="security-lines"><div><Check size={17}/><span>Password hashing on the API</span></div><div><Check size={17}/><span>Authenticated account access</span></div><div><Check size={17}/><span>Ownership checks on transactions</span></div><div><Check size={17}/><span>Idempotent, database-backed transfers</span></div></div><div className="settings-security-foot"><LockKeyhole size={17}/>{DEMO_MODE ? 'Demo mode stores fictional account state in your browser.' : 'You are connected to the Spring Boot demo API.'}</div></section></div>
    <div className="settings-warning"><Info size={20}/><div><strong>Important: this is a portfolio project, not a bank.</strong><p>No real account numbers or financial services are provided. Do not submit actual banking credentials, payment details, or sensitive information.</p></div></div>
  </div>;
}
