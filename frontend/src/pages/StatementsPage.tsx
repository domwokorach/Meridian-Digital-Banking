import { useState, type FormEvent } from 'react';
import { CalendarDays, Check, Download, FileDown, FileText, Info, ShieldCheck } from 'lucide-react';
import { useBank } from '../context/BankContext';
import { api } from '../lib/api';
import { isoDate, maskedAccount } from '../lib/format';
export default function StatementsPage() {
  const { accounts, loading } = useBank();
  const [account, setAccount] = useState('');
  const [from, setFrom] = useState(isoDate(90));
  const [to, setTo] = useState(isoDate());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const selected = account || accounts[0]?.id;
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setDone(false);
    if (from > to) { setError('The start date must be before the end date.'); return; }
    setBusy(true);
    try {
      const blob = await api.statement(selected, from, to);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `meridian-statement-${from}-to-${to}.csv`;
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); setDone(true);
    } catch (ex) { setError(ex instanceof Error ? ex.message : 'Could not download statement'); }
    finally { setBusy(false); }
  };
  if (loading) return <div className="page-loading"><div className="spinner"/> Preparing statements…</div>;
  return <div><div className="page-top"><div><div className="page-kicker">YOUR DOCUMENTS</div><h1>Statements & downloads</h1><p>A clear record of where your money has been.</p></div></div>
    <div className="statements-layout"><section className="surface-panel statement-form-panel"><div className="statement-top"><div className="statement-icon"><FileText size={24}/></div><div><h2>Download a statement</h2><p>Get a CSV record of your account transactions.</p></div></div>
      <form onSubmit={submit} className="statement-form"><label>Choose an account<select value={selected} onChange={e => setAccount(e.target.value)}>{accounts.map(a => <option key={a.id} value={a.id}>{a.name} · {maskedAccount(a.accountNumber)}</option>)}</select></label><div className="date-grid"><label>From<input type="date" value={from} onChange={e => setFrom(e.target.value)} max={to} required/></label><label>To<input type="date" value={to} onChange={e => setTo(e.target.value)} max={isoDate()} min={from} required/></label></div>
      <div className="statement-format"><div className="format-file-icon"><FileDown size={23}/></div><div><strong>CSV statement</strong><span>Opens in Excel, Google Sheets, and other spreadsheet apps</span></div><span className="format-badge">.CSV</span></div>
      {error && <div className="form-error" role="alert">{error}</div>}{done && <div className="success-inline"><Check size={17}/> Your statement has been downloaded.</div>}
      <button type="submit" disabled={busy || !accounts.length} className="btn btn-primary statement-submit"><Download size={18}/>{busy ? 'Preparing file…' : 'Download statement'}</button></form>
    </section>
    <aside className="statement-guidance"><div className="guidance-icon"><CalendarDays size={25}/></div><h3>For your records.</h3><p>Choose your account and a date range to download itemised transactions, dates, amounts, and running balances.</p><div className="guidance-rule"/><div className="guidance-note"><Info size={18}/> This portfolio project exports CSV statements; they are not official bank documents.</div><div className="guidance-note"><ShieldCheck size={18}/> Statements include only your own account data.</div></aside></div>
  </div>;
}
