import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card } from '@/components/ui/Card'
import { PieChart as PieChartIcon } from 'lucide-react'

export function TicketAnalyticsChart({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  return (
    <Card className="h-full flex flex-col p-6">
      <div className="flex items-center gap-2 section-label mb-6">
        <PieChartIcon size={14} />
        Ticket Types Breakdown
      </div>
      
      <div className="flex-1 min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--theme-surface)', 
                borderColor: 'var(--color-border)',
                color: 'var(--color-navy)',
                borderRadius: '4px',
                fontSize: '13px',
                fontFamily: 'var(--font-family-body)'
              }}
              itemStyle={{ color: 'var(--color-navy)' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              wrapperStyle={{ 
                fontSize: '12px', 
                color: 'var(--color-muted)',
                fontFamily: 'var(--font-family-body)'
              }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
