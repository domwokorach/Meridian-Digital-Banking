import { Link } from 'react-router-dom';
export default function Brand({ compact = false }: { compact?: boolean }) {
  return <Link to="/" className={`brand ${compact ? 'brand-compact' : ''}`} aria-label="Meridian home">
    <span className="brand-symbol" aria-hidden="true"><span className="brand-symbol-inner">M</span></span>
    {!compact && <span className="brand-name">meridian<span className="brand-dot">.</span></span>}
  </Link>;
}
