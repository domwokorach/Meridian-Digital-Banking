/** Brand palette mirrored from src/index.css for places that need raw values (charts, canvas, card art). */
export const palette = {
  background: '#0B1020', surface: '#151D31', panel: '#1D2940',
  blue: '#2997FF', cyan: '#29C7F6', text: '#F8FAFC', textMuted: '#AAB7CE',
  success: '#22C78A', warning: '#F4B860', error: '#F16B7A',
} as const;
/** Chart series colours reference CSS variables so they follow the active theme. */
export const series = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'] as const;
/** Motion durations in seconds, matching the 120–200ms micro / 200–350ms panel guidance. */
export const motionTiming = { fast: 0.16, panel: 0.28 } as const;
export const spring = { type: 'spring', stiffness: 380, damping: 32 } as const;
