import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, ArrowRight, ArrowUpRight, ChevronRight, FileText, MoreHorizontal, Plus, ShieldCheck, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import AccountCard from '../components/AccountCard';
import TransactionList from '../components/TransactionList';
import { useBank } from '../context/BankContext';
import { useAuth } from '../context/AuthContext';
import { firstName, money, shortMoney, sumMoney } from '../lib/format';
import type { BankTransaction } from '../lib/types';
function monthlySummary(txns: BankTransaction[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5-i), 1);
    const month = d.getMonth(), year = d.getFullYear();
    const included = txns.filter(t => { const x = new Date(t.createdAt); return x.getMonth() === month && x.getFullYear() === year; });
    return { name: d.toLocaleString('en-GB', { month: 'short' }), income: included.filter(t => t.kind === 'CREDIT').reduce((s,t) => s+t.amount,0), out: included.filter(t => t.kind === 'DEBIT').reduce((s,t) => s+t.amount,0) };
  });
}
export default function DashboardPage() {
  const { session } = useAuth();
  const { accounts, transactions, loading, error, refresh } = useBank();
  const total = sumMoney(accounts.map(a => a.balance));
  const months = useMemo(() => monthlySummary(transactions), [transactions]);
  const max = Math.max(1, ...months.flatMap(m => [m.income, m.out]));
  const month = new Date().getMonth();
  const recentSpend = transactions.filter(t => t.kind === 'DEBIT' && new Date(t.createdAt).getMonth() === month && new Date(t.createdAt).getFullYear() === new Date().getFullYear()).reduce((s,t) => s + t.amount,0);
  if (loading) return <div className="page-loading"><div className="spinner"/> Getting your accounts ready…</div>;
  if (error) return <div className="empty-state"><h2>We couldn't load your banking data.</h2><p>{error}</p><button className="btn btn-primary" onClick={() => void refresh()}>Try again</button></div>;
  return <div className="dashboard-page">
    <div className="page-top"><div><div className="page-kicker">YOUR FINANCIAL OVERVIEW</div><h1>Good morning, {firstName(session!.user.fullName)} <span className="hello-mark">✳</span></h1><p>Here’s what’s happening with your money today.</p></div><div className="page-top-actions"><span className="today-badge"><span/> All accounts active</span></div></div>
    <section className="balance-panel"><div className="balance-panel-copy"><span>YOUR TOTAL BALANCE <Sparkles size={16}/></span><h2>{money(total)}</h2><p>Across {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} <span>·</span> It’s all yours to manage</p></div><div className="balance-panel-graphic"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><span className="balance-graphic-symbol">M</span></div><Link to="/app/transfer" className="balance-transfer">Make a transfer <ArrowUpRight size={18}/></Link></section>
    <div className="dashboard-section-heading"><h2>Your accounts <span>{accounts.length}</span></h2><Link to="/app/accounts">View all accounts <ArrowRight size={17}/></Link></div>
    {accounts.length === 0 ? <div className="empty-state"><h2>No accounts yet</h2><p>Your accounts will appear here once they’re opened.</p></div> : <div className="account-card-grid">{accounts.map(a => <AccountCard key={a.id} account={a}/>)}</div>}
    <div className="dashboard-content-grid"><section className="surface-panel quick-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p>The everyday essentials, just a tap away.</p></div><MoreHorizontal size={20}/></div><div className="quick-action-grid">
      <Link to="/app/transfer"><span className="action-icon blue"><ArrowLeftRight size={23}/></span><strong>Move money</strong><small>Transfer between accounts</small><ArrowUpRight className="quick-arrow" size={17}/></Link>
      <Link to="/app/statements"><span className="action-icon lavender"><FileText size={23}/></span><strong>Statements</strong><small>Download your history</small><ArrowUpRight className="quick-arrow" size={17}/></Link>
      <Link to="/app/accounts"><span className="action-icon green"><Wallet size={23}/></span><strong>Account details</strong><small>Balances and activity</small><ArrowUpRight className="quick-arrow" size={17}/></Link>
    </div><div className="quick-help"><ShieldCheck size={20}/><div><strong>In control, from anywhere.</strong><span>Your demo information stays within this simulated banking environment.</span></div><ChevronRight size={18}/></div></section>
      <section className="surface-panel insights-panel"><div className="panel-heading"><div><h2>Money in & out</h2><p>Your last six months at a glance</p></div><TrendingUp size={20} className="heading-blue"/></div>
      <div className="chart-legend"><span><i className="legend-blue"/> Money in</span><span><i className="legend-navy"/> Money out</span></div>
      <div className="cash-chart">{months.map((m, i) => <div key={i} className="chart-column"><div className="chart-bars"><div className="chart-bar chart-income" style={{ height: `${Math.max(3, (m.income / max) * 100)}%` }} title={`${m.name} income ${money(m.income)}`}/><div className="chart-bar chart-expense" style={{ height: `${Math.max(3, (m.out / max) * 100)}%` }} title={`${m.name} outgoings ${money(m.out)}`}/></div><span>{m.name}</span></div>)}</div>
      <div className="insights-bottom"><div><span>SPENT THIS MONTH</span><strong>{shortMoney(recentSpend)}</strong></div><Link to="/app/accounts"><span>See activity</span><ArrowUpRight size={18}/></Link></div></section>
    </div>
    <section className="surface-panel dashboard-transactions"><div className="panel-heading"><div><h2>Recent activity</h2><p>A closer look at the latest movements</p></div><Link to="/app/accounts" className="panel-view-link">See all transactions <ArrowRight size={17}/></Link></div><TransactionList items={transactions.slice(0,6)}/></section>
    <section className="dashboard-bottom-banner"><div className="bottom-banner-icon"><Plus size={25}/></div><div><h3>There’s more to your money.</h3><p>Make a little progress, every day. Explore everything your Meridian dashboard can do.</p></div><Link to="/app/transfer">Get moving <ArrowRight size={18}/></Link></section>
  </div>;
}
