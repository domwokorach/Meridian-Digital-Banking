import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import Brand from '../components/Brand';
import { useAuth } from '../context/AuthContext';
import { DEMO_MODE } from '../lib/api';
export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { session, login, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  if (session) return <Navigate to="/app" replace/>;
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
      navigate('/app', { replace: true });
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again'); }
    finally { setLoading(false); }
  };
  const fillDemo = () => { setEmail('demo@meridian.test'); setPassword('Demo1234!'); setError(''); };
  return <div className="auth-page"><div className="auth-left"><Link to="/" className="auth-back"><ArrowLeft size={18}/> Back to website</Link><Brand/>
    <div className="auth-promo"><div className="auth-promo-icon"><Sparkles size={24}/></div><h2>Good things happen when your money feels simple.</h2><p>One clear space for every balance, every transfer, and every next step.</p><div className="auth-promo-lines"><span/><span/><span/></div></div>
    <div className="auth-security"><ShieldCheck size={19}/> Financial experiences, thoughtfully designed.</div>
  </div>
  <div className="auth-right"><div className="auth-card"><div className="auth-mobile-logo"><Brand/></div><div className="auth-kicker">WELCOME TO MERIDIAN</div><h1>{mode === 'login' ? 'Welcome back.' : 'Make yourself at home.'}</h1><p className="auth-subtitle">{mode === 'login' ? 'Your banking, all in one place. Let’s get you signed in.' : 'Create your portfolio demo account in a few easy steps.'}</p>
    <form onSubmit={onSubmit} className="auth-form">
      {mode === 'register' && <label>Full name<input value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={120} placeholder="e.g. Alex Morgan" autoComplete="name"/></label>}
      <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email"/></label>
      <label>Password<div className="password-field"><input type={visible ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === 'register' ? 10 : undefined} placeholder={mode === 'register' ? 'At least 10 characters' : 'Enter your password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}/><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={20}/> : <Eye size={20}/>}</button></div></label>
      {mode === 'register' && <div className="auth-hint"><LockKeyhole size={15}/> This is a fictional bank. Please do not use a real banking password.</div>}
      {error && <div role="alert" className="form-error">{error}</div>}
      <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>{loading ? 'Please wait…' : mode === 'login' ? 'Log in securely' : 'Create demo account'} <ArrowRight size={19}/></button>
    </form>
    {mode === 'login' && <div className="demo-credentials"><div className="demo-heading"><span><Check size={15}/></span> Want to explore first?</div><p>Use these fictional test credentials to access the dashboard.</p><div className="demo-login-row"><div><strong>demo@meridian.test</strong><small>Demo1234!</small></div><button type="button" onClick={fillDemo}>Fill demo login <ArrowRight size={15}/></button></div></div>}
    <div className="auth-switch">{mode === 'login' ? <>New around here? <Link to="/register" state={{ from: location.pathname }}>Create an account</Link></> : <>Already have an account? <Link to="/login">Log in</Link></>}</div>
    <div className="auth-legal">{DEMO_MODE ? 'Browser-only demonstration · No server connection' : 'Secure demo API connection'}<br/>Not a real bank. Never enter real financial credentials.</div>
  </div></div></div>;
}
