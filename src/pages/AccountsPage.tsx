import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, ArrowUpRight, CreditCard, Filter, Search, Wallet } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import AccountCard from '../components/AccountCard';
import TransactionList from '../components/TransactionList';
import { useBank } from '../context/BankContext';
import { money } from '../lib/format';
export default function AccountsPage() {
  const { accounts, transactions, loading } = useBank();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('account') || accounts[0]?.id || '';
  const [filter, setFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [query, setQuery] = useState('');
  const selected = accounts.find(a => a.id === selectedId) || accounts[0];
  useEffect(() => { if (selected && params.has('account') && !accounts.some(a => a.id === params.get('account'))) setParams({}, { replace: true }); }, [accounts, params, selected, setParams]);
  const filtered = useMemo(() => transactions.filter(t => t.accountId === selected?.id && (filter === 'ALL' || t.kind === filter) && t.description.toLowerCase().includes(query.toLowerCase())), [transactions, selected?.id, filter, query]);
  if (loading) return <div className="page-loading"><div className="spinner"/> Loading your accounts…</div>;
  if (!selected) return <div className="empty-state">No accounts available.</div>;
  return <div><div className="page-top"><div><div className="page-kicker">YOUR MONEY</div><h1>My accounts</h1><p>Everything in one place. Every detail at your fingertips.</p></div><Link to="/app/transfer" className="btn btn-primary"><ArrowLeftRight size={18}/> Make a transfer</Link></div>
    <div className="account-card-grid">{accounts.map(a => <AccountCard key={a.id} account={a}/>)}</div>
    <div className="account-detail-panel surface-panel"><div className="account-detail-head"><div className="account-detail-icon"><CreditCard size={24}/></div><div><span>ACCOUNT DETAILS</span><h2>{selected.name}</h2></div><div className="account-detail-balance">{money(selected.balance)}<small>Available balance</small></div></div>
      <div className="account-numbers"><div><span>Account holder</span><strong>Personal account</strong></div><div><span>Sort code</span><strong>{selected.sortCode}</strong></div><div><span>Account number</span><strong>{selected.accountNumber}</strong></div><div><span>Account type</span><strong>{selected.accountType === 'CURRENT' ? 'Current' : 'Savings'}</strong></div></div>
      <div className="account-select-label">SWITCH ACCOUNT</div><div className="account-switcher">{accounts.map(a => <button key={a.id} onClick={() => setParams({ account: a.id })} className={selected.id === a.id ? 'active' : ''}>{a.name}</button>)}</div>
    </div>
    <section className="surface-panel history-panel"><div className="panel-heading"><div><h2>Transaction history</h2><p>Every little detail, easy to find</p></div><span className="history-count">{filtered.length} transactions</span></div><div className="transaction-toolbar"><label className="transaction-search"><Search size={18}/><input placeholder="Search transactions" value={query} onChange={e => setQuery(e.target.value)}/></label><div className="transaction-filter"><Filter size={17}/><select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} aria-label="Transaction type"><option value="ALL">All activity</option><option value="CREDIT">Money in</option><option value="DEBIT">Money out</option></select></div></div><TransactionList items={filtered}/></section>
    <div className="account-footer-help"><Wallet size={18}/><span>Only fictional funds are used in this application.</span><Link to="/app/statements">Download statement <ArrowUpRight size={16}/></Link></div>
  </div>;
}
