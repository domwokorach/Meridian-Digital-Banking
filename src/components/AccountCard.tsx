import { ArrowUpRight, CreditCard, PiggyBank } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BankAccount } from '../lib/types';
import { accountEnding, money } from '../lib/format';
export default function AccountCard({ account, compact = false }: { account: BankAccount; compact?: boolean }) {
  const savings = account.accountType === 'SAVINGS';
  return <div className={`account-card ${savings ? 'account-card-savings' : ''} ${compact ? 'account-card-compact' : ''}`}>
    <div className="account-card-top"><span className="account-card-icon">{savings ? <PiggyBank size={20}/> : <CreditCard size={20}/>}</span><span className="card-ellipsis">•••</span></div>
    <div><span className="account-card-label">{account.name}</span><div className="account-card-balance">{money(account.balance)}</div><div className="account-card-meta">Sort code: {account.sortCode} <span>·</span> {accountEnding(account.accountNumber)}</div></div>
    <Link to={`/app/accounts?account=${account.id}`} className="account-card-arrow" aria-label={`View ${account.name}`}><ArrowUpRight size={21}/></Link>
    <div className="card-glow" aria-hidden="true"/>
  </div>;
}
