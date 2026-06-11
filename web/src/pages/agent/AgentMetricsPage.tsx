import { StatsCard } from '@/components/admin/StatsCard'
import { useAgentMetrics } from '@/hooks/useAdmin'
import { Card } from '@/components/ui/Card'

export default function AgentMetricsPage() {
  const { data } = useAgentMetrics()

  const rate = data?.resolutionRate ?? 0
  const insight = rate >= 80 ? 'High Resolution Rate' : rate >= 60 ? 'Moderate Performance' : 'Needs Attention'

  return <div className="space-y-6"><h1 className="page-header">My Metrics</h1><div className="grid grid-cols-2 lg:grid-cols-5 gap-4"><StatsCard label="Assigned" value={data?.assigned ?? 0} /><StatsCard label="Resolved" value={data?.resolved ?? 0} /><StatsCard label="Escalated" value={data?.escalated ?? 0} /><StatsCard label="In Progress" value={data?.inProgress ?? 0} /><StatsCard label="Resolution %" value={rate} /></div><div className="grid gap-4 lg:grid-cols-3"><Card><h3>Performance</h3><div style={{color: rate >=80 ? 'green' : rate >=60 ? 'orange' : 'red'}}>{rate}%</div></Card><Card><h3>Work Breakdown</h3><div>Resolved: {data?.resolved}</div><div>In Progress: {data?.inProgress}</div><div>Escalated: {data?.escalated}</div></Card><Card><h3>Insight</h3><p>{insight}</p></Card></div></div>
}