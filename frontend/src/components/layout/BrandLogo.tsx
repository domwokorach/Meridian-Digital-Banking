import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
/** Original Meridian monogram: a meridian arc crossing an M. */
export default function BrandLogo({ className }: { className?: string }) {
  return <Link to="/app" aria-label="Meridian home" className={cn('flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/60', className)}>
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><defs><linearGradient id="mlogo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2997FF"/><stop offset="1" stopColor="#29C7F6"/></linearGradient></defs>
      <rect width="34" height="34" rx="10" fill="url(#mlogo)"/><path d="M9 24V10l8 9 8-9v14" fill="none" stroke="#04101F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 27c8-3 16-3 24 0" fill="none" stroke="#04101F" strokeOpacity=".35" strokeWidth="1.4" strokeLinecap="round"/></svg>
    <span className="text-lg font-semibold tracking-tight">meridian<span className="text-primary">.</span></span>
  </Link>;
}
