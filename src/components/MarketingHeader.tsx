import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogIn, MapPin, Menu, Phone, Search, X } from 'lucide-react';
import Brand from './Brand';
import { useAuth } from '../context/AuthContext';

const links = ['Accounts', 'Credit cards', 'Savings', 'Loans', 'Mortgages', 'Investments', 'Insurance', 'Help & support'];
export default function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState('');
  const { session } = useAuth();
  const navigate = useNavigate();
  return <header className="marketing-header">
    <div className="shell header-top">
      <div className="header-brand"><Brand /><span className="personal-chip">Personal <ChevronDown size={14}/></span></div>
      <div className="header-utility">
        <a href="#footer"><Phone size={17}/> About demo</a>
        <a href="#products"><MapPin size={17}/> Explore</a>
        <button className="utility-button" onClick={() => setSearch(!search)}><Search size={19}/> Search</button>
        <Link to={session ? '/app' : '/login'} className="btn btn-primary btn-header">{session ? 'My banking' : 'Log in'} <LogIn size={15}/></Link>
      </div>
      <button className="mobile-menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X/> : <Menu/>}</button>
    </div>
    <div className={`nav-row ${open ? 'nav-row-open' : ''}`}><nav className="shell marketing-nav" aria-label="Main navigation">
      {links.map((link, index) => <a key={link} href={index === 7 ? '#footer' : '#products'} onClick={() => setOpen(false)}>{link}</a>)}
      <button className="nav-mobile-login" onClick={() => navigate(session ? '/app' : '/login')}>{session ? 'My banking' : 'Log in'} →</button>
    </nav></div>
    {search && <form className="header-search shell" onSubmit={e => { e.preventDefault(); navigate(query.trim() ? `/?search=${encodeURIComponent(query.trim())}` : '/'); setSearch(false); setTimeout(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }), 0); }}><Search size={20}/><input aria-label="Search banking products" value={query} onChange={e => setQuery(e.target.value)} autoFocus placeholder="What can we help you find?"/><button type="submit">Explore products</button></form>}
  </header>;
}
