import { useCallback, useState } from 'react';
export type DashboardPrefs = { insights: boolean; goals: boolean; activity: boolean };
const KEY = 'meridian_dashboard_prefs_v1';
const defaults: DashboardPrefs = { insights: true, goals: true, activity: true };
const read = (): DashboardPrefs => { try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return defaults; } };
/** Which dashboard sections the customer wants to see; a per-browser convenience only. */
export function useDashboardPrefs() {
  const [prefs, setPrefs] = useState(read);
  const set = useCallback((key: keyof DashboardPrefs, on: boolean) => setPrefs(p => { const next = { ...p, [key]: on }; try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ } return next; }), []);
  return [prefs, set] as const;
}
