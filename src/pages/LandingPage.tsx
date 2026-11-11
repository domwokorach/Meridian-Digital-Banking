import { ArrowDownLeft, ArrowLeftRight, ArrowRight, ArrowUpRight, BadgeCheck, Banknote, BarChart3, Check, ChevronRight, CreditCard, Headphones, Landmark, LockKeyhole, PiggyBank, Plus, ShieldCheck, Smartphone, Sparkles, Umbrella, Wallet, type LucideIcon } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import MarketingHeader from '../components/MarketingHeader';
import Brand from '../components/Brand';
import { useAuth } from '../context/AuthContext';
const products: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Wallet, title: 'Current accounts', text: 'Everyday banking, made remarkably simple.' },
  { icon: CreditCard, title: 'Credit cards', text: 'Make confident choices for your next chapter.' },
  { icon: PiggyBank, title: 'Savings accounts', text: 'Make more room for tomorrow’s possibilities.' },
  { icon: Banknote, title: 'Personal loans', text: 'Big plans deserve a clear plan forward.' },
  { icon: Landmark, title: 'Mortgages', text: 'A home for your goals, and everything after.' },
  { icon: Umbrella, title: 'Insurance', text: 'A little reassurance goes a long way.' },
  { icon: BarChart3, title: 'Investments', text: 'Find your own way to build for the future.' },
  { icon: Plus, title: 'More with Meridian', text: 'Thoughtful tools for your financial life.' },
];
export default function LandingPage() {
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const searchTerm = (searchParams.get('search') || '').trim().toLowerCase();
  const visibleProducts = products.filter(p => !searchTerm || `${p.title} ${p.text}`.toLowerCase().includes(searchTerm));
  return <div className="landing"><MarketingHeader />
    <section className="hero-shell"><div className="shell hero-grid">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/> PERSONAL BANKING, REIMAGINED</div>
        <h1>A better way<br/>to <em>be with</em><br/>your money.</h1>
        <p>Everything you need to feel in control of your finances, in one refreshingly simple place.</p>
        <div className="hero-buttons"><Link className="btn btn-white" to={session ? '/app' : '/register'}>{session ? 'Open your dashboard' : 'Get started'} <ArrowUpRight size={18}/></Link><a href="#features" className="hero-secondary">Discover more <ArrowRight size={17}/></a></div>
        <div className="hero-mini"><ShieldCheck size={18}/> A secure, fictional experience for portfolio exploration</div>
      </div>
      <div className="hero-art" aria-label="Illustration of a Meridian bank card"><div className="hero-arc hero-arc-one"/><div className="hero-arc hero-arc-two"/>
        <div className="hero-spotlight"/><div className="card-shadow"/>
        <div className="floating-card"><div className="floating-card-top"><div className="card-chip"><span/></div><span className="card-contactless">)))</span></div><div className="card-main-logo"><span className="card-m-logo">M</span></div><div className="floating-card-bottom"><div><small>meridian.</small><span>premier</span></div><strong>DEMO</strong></div></div>
        <div className="hero-trust"><ShieldCheck size={21}/> Built for what’s next</div>
      </div>
    </div></section>
    <section className="trust-strip"><div className="shell trust-content"><div><span className="trust-icon"><LockKeyhole size={20}/></span><span>Banking built around you</span></div><div><span className="trust-icon"><Smartphone size={20}/></span><span>Manage money your way</span></div><div><span className="trust-icon"><BadgeCheck size={20}/></span><span>Designed for peace of mind</span></div></div></section>
    <section className="section-wrap intro-section" id="products"><div className="shell">
      <div className="section-heading"><div><div className="section-kicker">EVERYDAY BANKING</div><h2>Whatever life looks like,<br/><span>we’re here for it.</span></h2><p>Explore the tools and products that put possibilities within reach.</p></div><Link to="/register" className="text-link">Start your journey <ArrowUpRight size={18}/></Link></div>
      {searchTerm && <div className="search-results-caption">Results for <strong>“{searchTerm}”</strong> <Link to="/">Clear search ×</Link></div>}
      <div className="products-grid">{visibleProducts.map(({ icon: Icon, title, text }) => <Link to={session ? '/app' : '/register'} className="product-card" key={title}><span className="product-icon"><Icon size={25} strokeWidth={1.7}/></span><h3>{title}</h3><p>{text}</p><span className="product-go"><ArrowUpRight size={19}/></span></Link>)}</div>
      {!visibleProducts.length && <div className="empty-public-search">No matching products found. Try searching for accounts, savings, or loans.</div>}
    </div></section>
    <section className="feature-section" id="features"><div className="shell feature-content"><div className="feature-copy"><div className="section-kicker">BANK ON THE MOVE</div><h2>Powerful features.<br/><span>Right at your fingertips.</span></h2><p>From real-time transaction history to easy transfers between your accounts, the Meridian experience keeps things beautifully straightforward.</p>
      <div className="feature-points"><span><Check size={17}/> Accounts in one place</span><span><Check size={17}/> Move money in moments</span><span><Check size={17}/> Download your statements</span></div><Link to={session ? '/app' : '/login'} className="btn btn-outline-blue">{session ? 'View your dashboard' : 'Explore the demo'} <ArrowUpRight size={18}/></Link></div>
      <div className="phone-scene"><div className="phone-orbit"/><div className="phone phone-back"><div className="phone-notch"/><div className="phone-back-screen"><span>meridian.</span><div className="phone-back-card">M <span>•••• 2936</span></div></div></div>
        <div className="phone phone-front"><div className="phone-notch"/><div className="phone-screen"><div className="phone-top"><span>9:41</span><span>▰ ◕ ▮</span></div><div className="phone-hi">Good morning, Alex <span>✳</span></div><div className="phone-avatar">AM</div><div className="phone-balance-label">TOTAL BALANCE</div><div className="phone-balance">£21,422.69</div><div className="phone-sub">Across 2 accounts</div><div className="phone-actions"><div><ArrowLeftRight size={17}/>Transfer</div><div><ArrowDownLeft size={17}/>Receive</div><div><CreditCard size={17}/>Cards</div></div><div className="phone-activity-label">Recent activity <ChevronRight size={14}/></div><div className="phone-activity"><span className="phone-txn-icon">↗</span><div>Studio Supply <small>Shopping</small></div><strong>−£126.90</strong></div><div className="phone-activity"><span className="phone-txn-icon blue">↙</span><div>Salary <small>Income</small></div><strong className="positive">+£3,450</strong></div><div className="phone-nav">⌂ &nbsp;&nbsp;&nbsp;&nbsp; ▦ &nbsp;&nbsp;&nbsp;&nbsp; ⇄ &nbsp;&nbsp;&nbsp;&nbsp; ◯</div></div></div>
      </div></div></section>
    <section className="section-wrap care-section"><div className="shell care-grid"><div className="care-card"><div className="care-card-icon"><Headphones size={27}/></div><h3>Here when you need us.</h3><p>Easy-to-find support and intuitive journeys are part of the experience.</p><Link to="/login">Visit digital banking <ArrowRight size={17}/></Link></div><div className="care-card care-card-blue"><div className="care-card-icon"><Sparkles size={27}/></div><h3>Build something brilliant.</h3><p>See how a modern banking experience comes together across the frontend and backend.</p><Link to="/register">Try the portfolio demo <ArrowRight size={17}/></Link></div></div></section>
    <footer className="landing-footer" id="footer"><div className="shell"><div className="footer-main"><div className="footer-about"><Brand /><p>A thoughtfully designed fictional banking experience. Built to demonstrate full-stack engineering — not affiliated with any financial institution.</p></div><div><h4>Explore</h4><a href="#products">Our products</a><a href="#features">Digital banking</a><Link to="/register">Get started</Link></div><div><h4>Your banking</h4><Link to="/login">Log in</Link><Link to="/register">Create account</Link><Link to="/app">Dashboard</Link></div><div><h4>About this project</h4><span>React + TypeScript</span><span>Spring Boot API</span><span>PostgreSQL</span></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Meridian Bank — Portfolio concept.</span><span><ShieldCheck size={16}/> Simulated accounts only. No real funds or banking services.</span></div></div></footer>
  </div>;
}
