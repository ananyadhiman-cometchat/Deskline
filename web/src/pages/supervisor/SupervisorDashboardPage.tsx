import { StatsCard } from '@/components/admin/StatsCard'
import { useSupervisorDashboard } from '@/hooks/useAdmin'
import { Card } from '@/components/ui/Card'
import { TicketAnalyticsChart } from '@/components/admin/TicketAnalyticsChart'
import { Building, Activity, ShieldAlert, Users, Ticket, CheckCircle, Clock, Zap } from 'lucide-react'

export default function SupervisorDashboardPage() {
  const { data } = useSupervisorDashboard()

  const openEscalations = data?.openEscalations ?? 0
  const unassignedTickets = data?.unassignedTickets ?? 0
  const resolvedToday = data?.resolvedToday ?? 0
  const agentsCount = data?.agents ?? 0
  const departmentName = data?.department ?? 'Loading...'

  const isHealthCritical = openEscalations > 10
  const isHealthElevated = openEscalations > 5
  const healthLabel = isHealthCritical ? 'CRITICAL' : isHealthElevated ? 'ELEVATED' : 'OPTIMAL'
  const healthColor = isHealthCritical ? 'text-red-500' : isHealthElevated ? 'text-amber-500' : 'text-emerald-500'
  const healthBg = isHealthCritical ? 'bg-red-500/10' : isHealthElevated ? 'bg-amber-500/10' : 'bg-emerald-500/10'
  const healthBorder = isHealthCritical ? 'border-red-500/20' : isHealthElevated ? 'border-amber-500/20' : 'border-emerald-500/20'

  const queueData = [
    { name: 'Escalated', value: openEscalations, color: '#FF4655' },
    { name: 'Unassigned', value: unassignedTickets, color: '#f59e0b' },
    { name: 'Resolved Today', value: resolvedToday, color: '#10b981' },
  ].filter(d => d.value > 0)

  const chartData = queueData.length > 0 ? queueData : [{ name: 'No Data', value: 1, color: 'var(--theme-border)' }]

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-[var(--color-brand-red)]" />
            <span className="text-sm font-bold tracking-[0.2em] text-[var(--color-brand-red)] uppercase">Command Centre</span>
          </div>
          <h1 className="font-heading text-4xl text-[var(--theme-text-main)] tracking-wider">SUPERVISOR DASHBOARD</h1>
          <p className="text-[var(--color-muted)] mt-2">Real-time oversight for the {departmentName} department queue.</p>
        </div>
        <div className={`px-4 py-2 rounded-sm border ${healthBorder} ${healthBg} ${healthColor} flex items-center gap-3 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.1)]`}>
          <Activity size={18} className="animate-pulse" />
          <span className="text-xs font-bold tracking-[0.15em] uppercase">Status: {healthLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard label="Open Escalations" value={openEscalations} accent={isHealthElevated} />
        <StatsCard label="Unassigned Queue" value={unassignedTickets} />
        <StatsCard label="Resolved Today" value={resolvedToday} />
        <StatsCard label="Active Agents" value={agentsCount} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2 flex flex-col">
          <Card className={`flex-1 relative overflow-hidden flex flex-col items-center justify-center p-12 border ${healthBorder} transition-colors duration-500`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${isHealthCritical ? 'from-red-500/5' : isHealthElevated ? 'from-amber-500/5' : 'from-emerald-500/5'} to-transparent`} />

            <Activity className={`absolute -right-12 -bottom-12 w-96 h-96 ${healthColor} opacity-5 transition-colors duration-500`} />

            <div className="z-10 flex flex-col items-center text-center max-w-lg">
              <div className={`w-20 h-20 rounded-full ${healthBg} ${healthColor} flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,0,0,0.1)]`}>
                {isHealthCritical || isHealthElevated ? <ShieldAlert size={40} /> : <CheckCircle size={40} />}
              </div>
              <h2 className="font-heading text-5xl tracking-widest text-[var(--theme-text-main)] mb-4">{healthLabel}</h2>
              <p className="text-lg text-[var(--color-muted)]">
                {isHealthCritical
                  ? 'Immediate intervention required. Escalation volume exceeds nominal operating parameters.'
                  : isHealthElevated
                    ? 'Queue load is elevated. Recommend redistributing agent resources to handle spikes.'
                    : 'Queue is operating within nominal parameters. All metrics are looking good.'}
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="p-8 relative overflow-hidden group hover:border-[var(--color-border-hover)] transition-colors">
              <Building className="absolute right-[-10%] top-[-10%] w-48 h-48 text-[var(--color-muted)] opacity-[0.03] group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-[var(--color-muted)] uppercase mb-6">
                  <Building size={14} />
                  Department Overview
                </div>
                <div className="font-heading text-4xl text-[var(--theme-text-main)] tracking-wider mb-2">
                  {departmentName}
                </div>
                <div className="text-sm text-[var(--color-muted)] flex items-center gap-2">
                  <Users size={14} className="text-[var(--color-brand-red)]" />
                  {agentsCount} active support agents online
                </div>
              </div>
            </Card>

            <Card className="p-8 relative overflow-hidden group hover:border-[var(--color-border-hover)] transition-colors">
              <Clock className="absolute right-[-10%] top-[-10%] w-48 h-48 text-[var(--color-muted)] opacity-[0.03] group-hover:scale-110 transition-transform duration-700 -rotate-12" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-[var(--color-muted)] uppercase mb-6">
                  <Clock size={14} />
                  Resolution Velocity
                </div>
                <div className="font-heading text-4xl text-[var(--theme-text-main)] tracking-wider mb-2">
                  {resolvedToday}
                </div>
                <div className="text-sm text-[var(--color-muted)] flex items-center gap-2">
                  <Ticket size={14} className="text-[#10b981]" />
                  Tickets closed during this shift
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex flex-col">
          <TicketAnalyticsChart data={chartData} />
        </div>
      </div>
    </div>
  )
}