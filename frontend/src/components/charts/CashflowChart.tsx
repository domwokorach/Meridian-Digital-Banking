import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { shortMoney } from '../../lib/format';
import type { MonthSummary } from '../../lib/insights';
const config = { income: { label: 'Money in', color: 'var(--chart-3)' }, out: { label: 'Money out', color: 'var(--chart-1)' } } satisfies ChartConfig;
export default function CashflowChart({ data }: { data: MonthSummary[] }) {
  return <ChartContainer config={config} className="h-56 w-full" role="img" aria-label={`Money in and out over the last ${data.length} months`}>
    <BarChart data={data} barGap={4}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="name" tickLine={false} axisLine={false}/><YAxis tickFormatter={v => shortMoney(v)} width={56} tickLine={false} axisLine={false}/>
      <ChartTooltip content={<ChartTooltipContent formatter={(v) => shortMoney(Number(v))}/>}/><Bar dataKey="income" fill="var(--color-income)" radius={[6, 6, 0, 0]}/><Bar dataKey="out" fill="var(--color-out)" radius={[6, 6, 0, 0]}/></BarChart>
  </ChartContainer>;
}
