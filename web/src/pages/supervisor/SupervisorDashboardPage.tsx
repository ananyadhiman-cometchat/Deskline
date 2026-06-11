import { StatsCard } from '@/components/admin/StatsCard'
import { useSupervisorDashboard } from '@/hooks/useAdmin'
import { Card } from '@/components/ui/Card'

export default function SupervisorDashboardPage() {
  const { data } = useSupervisorDashboard()

  const health = (data?.openEscalations ?? 0) > 10 ? 'Critical' : (data?.openEscalations ?? 0) > 5 ? 'Elevated' : 'Healthy'

  return <div className="space-y-6"><h1 className="page-header">Supervisor Dashboard</h1><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><StatsCard label="Open Escalations" value={data?.openEscalations ?? 0} /><StatsCard label="Unassigned" value={data?.unassignedTickets ?? 0} /><StatsCard label="Resolved Today" value={data?.resolvedToday ?? 0} /><StatsCard label="Agents" value={data?.agents ?? 0} /></div><div className="grid gap-4 lg:grid-cols-3"><Card><h3>Department Summary</h3><p>{data?.department}</p><p>Agents: {data?.agents}</p></Card><Card><h3>Queue Health</h3><p>{health}</p></Card><Card><h3>Queue Distribution</h3><div>Escalations: {data?.openEscalations}</div><div>Unassigned: {data?.unassignedTickets}</div><div>Resolved: {data?.resolvedToday}</div></Card></div></div>
}