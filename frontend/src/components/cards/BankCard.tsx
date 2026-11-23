import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Snowflake, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CardVariant, DemoCard } from '../../lib/types';
const finish: Record<CardVariant, { name: string; bg: string; ink: string; sheen: string }> = {
  midnight: { name: 'Midnight Black', bg: 'linear-gradient(135deg,#2a2f3a 0%,#12151c 55%,#050608 100%)', ink: '#f4f6fa', sheen: 'rgba(255,255,255,.10)' },
  ocean: { name: 'Ocean Blue', bg: 'linear-gradient(135deg,#1566e8 0%,#1fa2f2 55%,#29c7f6 100%)', ink: '#ffffff', sheen: 'rgba(255,255,255,.22)' },
  titanium: { name: 'Titanium Silver', bg: 'linear-gradient(135deg,#f3f5f8 0%,#aeb6c3 45%,#e1e5ec 70%,#8f99a8 100%)', ink: '#1a2230', sheen: 'rgba(255,255,255,.55)' },
  royal: { name: 'Royal Navy', bg: 'linear-gradient(135deg,#1b2f8a 0%,#0e1c5c 55%,#070e33 100%)', ink: '#eef2ff', sheen: 'rgba(130,160,255,.18)' },
};
export const variantName = (v: CardVariant) => finish[v].name;
function Face({ children, back = false, style }: { children: React.ReactNode; back?: boolean; style: CSSProperties }) {
  return <div className="absolute inset-0 overflow-hidden rounded-[22px] p-5 shadow-[0_24px_40px_-18px_rgba(0,0,0,.7),inset_0_1px_0_rgba(255,255,255,.25)] sm:p-6" style={{ ...style, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: back ? 'rotateY(180deg)' : undefined }}>
    <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(120% 80% at 0% 0%, ${style.color === '#1a2230' ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.16)'}, transparent 55%), repeating-linear-gradient(115deg, rgba(255,255,255,.03) 0 2px, transparent 2px 6px)` }}/>
    {children}
  </div>;
}
/** Original, fictional card art. Only the last four digits ever appear; there is no PAN, CVV or PIN anywhere in this component. */
export default function BankCard({ card, className, flipped: controlled, onFlip, interactive = true }: { card: DemoCard; className?: string; flipped?: boolean; onFlip?: (flipped: boolean) => void; interactive?: boolean }) {
  const reduce = useReducedMotion();
  const [own, setOwn] = useState(false);
  const flipped = controlled ?? own;
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const f = finish[card.variant];
  const flip = () => { const next = !flipped; setOwn(next); onFlip?.(next); };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== 'mouse' || flipped) return;
    const r = ref.current!.getBoundingClientRect();
    setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 12, y: -((e.clientY - r.top) / r.height - 0.5) * 12 });
  };
  const key = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } };
  const face: CSSProperties = { background: f.bg, color: f.ink };
  const masked = `•••• •••• •••• ${card.last4}`;
  return <div className={cn('relative aspect-[1.586/1] w-full [perspective:1200px]', className)}>
    <motion.div ref={ref} role={interactive ? 'button' : 'img'} tabIndex={interactive ? 0 : -1} aria-pressed={interactive ? flipped : undefined}
      aria-label={`${f.name} ${card.kind === 'DEBIT' ? 'debit' : 'credit'} card ending ${card.last4}${card.frozen ? ', frozen' : ''}. ${interactive ? (flipped ? 'Showing back, press to show front' : 'Press to show back') : ''}`}
      onClick={interactive ? flip : undefined} onKeyDown={interactive ? key : undefined} onPointerMove={move} onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      className={cn('relative size-full rounded-[22px] outline-none focus-visible:ring-4 focus-visible:ring-ring/70', interactive && 'cursor-pointer')} style={{ transformStyle: 'preserve-3d' }}
      animate={{ rotateY: (flipped ? 180 : 0) + tilt.x, rotateX: tilt.y }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 220, damping: 26 }}>
      <Face style={face}>
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between"><span className="text-lg font-semibold tracking-tight">meridian<span style={{ color: card.variant === 'titanium' ? '#1566e8' : '#29c7f6' }}>.</span></span>
            <span className="flex items-center gap-2 text-[11px] font-medium tracking-wider uppercase opacity-80">{card.virtual && <span className="rounded-full border border-current px-2 py-0.5">Virtual</span>}{card.kind}</span></div>
          <div className="flex items-center gap-3"><svg width="46" height="36" viewBox="0 0 46 36" aria-hidden="true"><defs><linearGradient id={`chip-${card.id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6e3a4"/><stop offset=".5" stopColor="#c9a24a"/><stop offset="1" stopColor="#f1d27f"/></linearGradient></defs><rect width="46" height="36" rx="7" fill={`url(#chip-${card.id})`}/><path d="M0 12h14v12H0M32 12h14M32 24h14M14 6v24M32 6v24M14 18h18" stroke="#7a5c18" strokeOpacity=".55" strokeWidth="1.2" fill="none"/></svg><Wifi className="size-5 rotate-90 opacity-70" aria-hidden="true"/></div>
          <div><p className="font-mono text-[15px] tracking-[.18em] sm:text-lg" data-testid="card-number">{masked}</p>
            <div className="mt-2 flex items-end justify-between text-[11px] sm:text-xs"><div><span className="block opacity-60">CARDHOLDER</span><span className="font-medium tracking-wide uppercase">{card.holder}</span></div><div className="text-right"><span className="block opacity-60">EXPIRES</span><span className="font-medium">{card.expiry}</span></div>
              <span className="text-sm font-bold italic tracking-tight opacity-80" aria-label="Network placeholder">NETWORK</span></div></div>
        </div>
        {card.frozen && <div className="absolute inset-0 flex items-center justify-center bg-background/55 backdrop-blur-[2px]"><span className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-lg"><Snowflake className="size-4 text-cyan"/>Frozen</span></div>}
      </Face>
      <Face back style={face}>
        <div className="relative flex h-full flex-col">
          <div className="-mx-5 mt-1 h-10 bg-black/80 sm:-mx-6 sm:h-11"/>
          <div className="mt-4 flex items-center gap-3"><div className="flex h-9 flex-1 items-center rounded bg-white/90 px-3 text-xs font-mono text-black/70" aria-hidden="true">Signature on file</div><div className="rounded bg-white px-3 py-2 font-mono text-xs text-black" aria-label="Security code hidden">•••</div></div>
          <p className="mt-auto text-[10px] leading-snug opacity-70">Demo card issued by Meridian, a fictional bank. Not valid for payments. Never share your full card number, security code or PIN. Card ending {card.last4}.</p>
        </div>
      </Face>
    </motion.div>
  </div>;
}
