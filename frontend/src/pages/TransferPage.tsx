import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeftRight, ArrowRight, Check, ChevronDown, CircleCheck, Info, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBank } from '../context/BankContext';
import { api } from '../lib/api';
import { money, maskedAccount } from '../lib/format';
export default function TransferPage() {
  const { accounts, loading, refresh } = useBank();
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('Monthly savings');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ amount: number; to: string } | null>(null);
  useEffect(() => { if (accounts.length && !fromId) { setFromId(accounts[0].id); setToId(accounts[1]?.id || accounts[0].id); } }, [accounts, fromId]);
  const from = accounts.find(a => a.id === fromId);
  const to = accounts.find(a => a.id === toId);
  const numAmount = Number(amount);
  const valid = from && to && fromId !== toId && Number.isFinite(numAmount) && numAmount >= 0.01 && numAmount <= 50000 && /^\d+(\.\d{1,2})?$/.test(amount) && numAmount <= from.balance;
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault(); if (!valid || sending) return;
    setError(''); setSending(true);
    try {
      await api.transfer({ requestId: crypto.randomUUID(), fromAccountId: fromId, toAccountId: toId, amount: numAmount, reference });
      await refresh(); setSuccess({ amount: numAmount, to: to.name }); setAmount('');
    } catch (ex) { setError(ex instanceof Error ? ex.message : 'Transfer could not be completed'); }
    finally { setSending(false); }
  };
  if (loading) return <div className="page-loading"><div className="spinner"/> Loading your accounts…</div>;
  return <div><div className="page-top"><div><div className="page-kicker">MOVE MONEY</div><h1>Make a transfer</h1><p>Move money between your Meridian accounts, in a moment.</p></div><span className="secure-header-badge"><ShieldCheck size={17}/> Protected transfer</span></div>
    <div className="transfer-layout"><section className="surface-panel transfer-form-panel">
      {success ? <div className="transfer-success"><div className="success-icon"><Check size={32}/></div><div className="page-kicker">TRANSFER COMPLETE</div><h2>Money on the move!</h2><p>You’ve successfully transferred <strong>{money(success.amount)}</strong> to your <strong>{success.to}</strong>.</p><div className="success-details"><CircleCheck size={19}/> Both balances have been updated.</div><button className="btn btn-primary" onClick={() => setSuccess(null)}>Make another transfer <ArrowRight size={18}/></button><Link to="/app/accounts">View account activity</Link></div> : <><div className="transfer-step"><span>01</span><div><h2>Transfer details</h2><p>Choose where your money should go.</p></div></div>
      <form onSubmit={onSubmit} className="transfer-form"><label>From account<div className="transfer-select"><select value={fromId} onChange={e => { setFromId(e.target.value); if (e.target.value === toId) setToId(accounts.find(a => a.id !== e.target.value)?.id || ''); }} required>{accounts.map(a => <option key={a.id} value={a.id}>{a.name} — {maskedAccount(a.accountNumber)}</option>)}</select><ChevronDown size={20}/></div></label>
      <div className="from-balance"><span>Available balance</span><strong>{from ? money(from.balance) : '—'}</strong></div>
      <div className="transfer-swap"><span><ArrowLeftRight size={20}/></span></div>
      <label>To account<div className="transfer-select"><select value={toId} onChange={e => setToId(e.target.value)} required>{accounts.map(a => <option key={a.id} value={a.id}>{a.name} — {maskedAccount(a.accountNumber)}</option>)}</select><ChevronDown size={20}/></div></label>
      <div className="transfer-divider"/>
      <label>Amount<div className="amount-input"><span>£</span><input type="number" inputMode="decimal" min="0.01" max="50000" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required/></div></label>
      {from && numAmount > from.balance && <div className="field-error">This exceeds your available balance.</div>}
      <label>Reference <span className="optional-text">(optional)</span><input className="reference-input" value={reference} onChange={e => setReference(e.target.value)} maxLength={120} placeholder="What's this transfer for?"/></label>
      {error && <div role="alert" className="form-error">{error}</div>}
      <button type="submit" className="btn btn-primary transfer-submit" disabled={!valid || sending}>{sending ? 'Processing…' : 'Confirm transfer'} <ArrowRight size={18}/></button><p className="transfer-caution"><LockKeyhole size={14}/> Transfers are instant in this simulated environment.</p></form></>}
    </section>
    <aside className="transfer-side"><div className="transfer-info-card"><div className="transfer-info-icon"><ShieldCheck size={24}/></div><h3>A safe space to explore.</h3><p>Move fictional money between your own accounts and see transactions appear immediately.</p><div className="transfer-info-divider"/><div><Check size={17}/> No real payments</div><div><Check size={17}/> Instant balance updates</div><div><Check size={17}/> Built-in duplicate protection</div></div>
      <div className="transfer-tip"><Info size={19}/><div><strong>A quick note</strong><p>You can only transfer between accounts that belong to your demo profile.</p></div></div>
    </aside></div>
  </div>;
}
