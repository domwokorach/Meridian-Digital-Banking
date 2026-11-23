import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { demoContent } from '../../lib/demo';
import { money } from '../../lib/format';
import { goalProgress } from '../../lib/insights';
export default function GoalsPanel({ savingsBalance }: { savingsBalance: number }) {
  return <ul className="space-y-5">{demoContent.goals.map(g => { const { saved, percent } = goalProgress(g, savingsBalance); return <li key={g.id}>
    <div className="mb-2 flex items-baseline justify-between gap-2"><span className="text-sm font-medium">{g.name}</span><span className="text-xs text-muted-foreground tabular-nums">{money(saved)} of {money(g.target)}</span></div>
    <Progress value={percent} aria-label={`${g.name} progress`} className="gap-0"><ProgressTrack className="h-2"><ProgressIndicator className="rounded-full bg-gradient-to-r from-primary to-cyan"/></ProgressTrack></Progress>
    <div className="mt-1.5 flex justify-between text-xs text-muted-foreground"><span>{percent}% saved</span><span>Target {new Date(g.targetDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span></div></li>; })}
    <li><Badge variant="outline" className="border-warning/50 text-warning">Demo data · goals are not stored by the bank</Badge></li></ul>;
}
