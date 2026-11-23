import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { motionTiming } from '../../lib/design-tokens';
/** Fade-and-rise entrance. `delay` lets siblings stagger without layout shift. */
export default function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: motionTiming.panel, delay, ease: 'easeOut' }}>{children}</motion.div>;
}
