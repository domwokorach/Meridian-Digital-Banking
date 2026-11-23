import { Cell, Pie, PieChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { money, shortMoney } from '../../lib/format';
import { series } from '../../lib/design-tokens';
export default function CategoryChart({ data }: { data: { name: string; value: number }[] }) {
  const config: ChartConfig = Object.fromEntries(data.map((d, i) => [d.name, { label: d.name, color: series[i % series.length] }]));
  const total = data.reduce((s, d) => s + d.value, 0);
  return <div className="flex flex-col items-center gap-4 sm:flex-row">
    <ChartContainer config={config} className="size-44 shrink-0" role="img" aria-label="Spending by category">
      <PieChart><ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" formatter={(v) => money(Number(v))}/>}/><Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} strokeWidth={0}>{data.map((d, i) => <Cell key={d.name} fill={series[i % series.length]}/>)}</Pie></PieChart>
    </ChartContainer>
    <ul className="w-full space-y-2 text-sm">{data.slice(0, 5).map((d, i) => <li key={d.name} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: series[i % series.length] }} aria-hidden="true"/><span className="flex-1 text-muted-foreground">{d.name}</span><span className="font-medium tabular-nums">{shortMoney(d.value)}</span><span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{Math.round((d.value / total) * 100)}%</span></li>)}</ul>
  </div>;
}
