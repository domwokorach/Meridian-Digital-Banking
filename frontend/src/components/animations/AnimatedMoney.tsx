import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import { money } from '../../lib/format';
/** Counts smoothly from the previous value to the new one; renders the final figure immediately when reduced motion is on. */
export default function AnimatedMoney({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  const from = useRef(value);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (reduce || from.current === value) { from.current = value; setShown(value); return; }
    const controls = animate(from.current, value, { duration: 0.6, ease: 'easeOut', onUpdate: v => setShown(v), onComplete: () => setShown(value) });
    from.current = value;
    return () => controls.stop();
  }, [value, reduce]);
  return <span className={className}>{money(shown)}</span>;
}
