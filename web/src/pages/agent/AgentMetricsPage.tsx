import { StatsCard } from '@/components/admin/StatsCard'
import { useAgentMetrics } from '@/hooks/useAdmin'
import { Card } from '@/components/ui/Card'
import { Activity, ShieldAlert, CheckCircle, Clock, Zap, Target, ArrowUpRight, CheckSquare } from 'lucide-react'

export default function AgentMetricsPage() {
  const { data } = useAgentMetrics()

  const assigned = data?.assigned ?? 0
  const resolved = data?.resolved ?? 0
  const escalated = data?.escalated ?? 0
  const inProgress = data?.inProgress ?? 0
  const rate = data?.resolutionRate ?? 0

  const isOptimal = rate >= 80
  const isAcceptable = rate >= 60 && rate < 80

  const healthLabel = isOptimal ? 'OPTIMAL' : isAcceptable ? 'ACCEPTABLE' : 'CRITICAL'
  const healthColor = isOptimal ? 'text-emerald-500' : isAcceptable ? 'text-amber-500' : 'text-red-500'
  const healthBg = isOptimal ? 'bg-emerald-500/10' : isAcceptable ? 'bg-amber-500/10' : 'bg-red-500/10'
  const healthBorder = isOptimal ? 'border-emerald-500/20' : isAcceptable ? 'border-amber-500/20' : 'border-red-500/20'

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-[var(--color-brand-red)]" />
            <span className="text-sm font-bold tracking-[0.2em] text-[var(--color-brand-red)] uppercase">Operator Console</span>
          </div>
          <h1 className="font-heading text-4xl text-[var(--theme-text-main)] tracking-wider">MY METRICS</h1>
          <p className="text-[var(--color-muted)] mt-2">Real-time performance analytics for your operational shift.</p>
        </div>
        <div className={`px-4 py-2 rounded-sm border ${healthBorder} ${healthBg} ${healthColor} flex items-center gap-3 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.1)]`}>
          <Activity size={18} className="animate-pulse" />
          <span className="text-xs font-bold tracking-[0.15em] uppercase">Performance: {healthLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard label="Assigned" value={assigned} />
        <StatsCard label="In Progress" value={inProgress} />
        <StatsCard label="Escalated" value={escalated} accent={escalated > 0} />
        <StatsCard label="Resolved" value={resolved} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2 flex flex-col">
          <Card className={`flex-1 relative overflow-hidden flex flex-col items-center justify-center p-12 border ${healthBorder} transition-colors duration-500`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${isOptimal ? 'from-emerald-500/5' : isAcceptable ? 'from-amber-500/5' : 'from-red-500/5'} to-transparent`} />

            <Target className={`absolute -right-12 -bottom-12 w-96 h-96 ${healthColor} opacity-5 transition-colors duration-500`} />

            <div className="z-10 flex flex-col items-center text-center max-w-lg">
              <div className={`w-20 h-20 rounded-full ${healthBg} ${healthColor} flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,0,0,0.1)]`}>
                {isOptimal ? <CheckCircle size={40} /> : isAcceptable ? <Activity size={40} /> : <ShieldAlert size={40} />}
              </div>
              <h2 className="font-heading text-5xl tracking-widest text-[var(--theme-text-main)] mb-4">{rate}%</h2>
              <div className="section-label mb-4 flex items-center justify-center gap-2">
                <Target size={16} />
                Resolution Rate
              </div>
              <p className="text-lg text-[var(--color-muted)]">
                {isOptimal
                  ? 'Exceptional performance. You are efficiently resolving assigned tickets.'
                  : isAcceptable
                    ? 'Solid work. Focus on closing out your remaining active tickets to boost your rate.'
                    : 'Resolution rate is below nominal thresholds. Consider escalating complex tickets if blocked.'}
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="p-8 relative overflow-hidden group hover:border-[var(--color-border-hover)] transition-colors">
              <CheckSquare className="absolute right-[-10%] top-[-10%] w-48 h-48 text-[var(--color-muted)] opacity-[0.03] group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-[var(--color-muted)] uppercase mb-6">
                  <CheckSquare size={14} />
                  Work Breakdown
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[var(--color-muted)]">Resolved</span>
                    <span className="font-heading text-2xl text-[var(--theme-text-main)]">{resolved}</span>
                  </div>
                  <div className="w-full bg-[var(--color-border)] h-1 rounded-full overflow-hidden">
                    <div className="bg-[#10b981] h-full" style={{ width: `${assigned > 0 ? (resolved / assigned) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8 relative overflow-hidden group hover:border-[var(--color-border-hover)] transition-colors">
              <ArrowUpRight className="absolute right-[-10%] top-[-10%] w-48 h-48 text-[var(--color-muted)] opacity-[0.03] group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-[var(--color-muted)] uppercase mb-6">
                  <ArrowUpRight size={14} />
                  Active Queue
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[var(--color-muted)]">In Progress</span>
                    <span className="font-heading text-2xl text-[var(--theme-text-main)]">{inProgress}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[var(--color-brand-red)]">Escalated</span>
                    <span className="font-heading text-xl text-[var(--theme-text-main)]">{escalated}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex flex-col">
          <Card className="flex-1 p-8 relative overflow-hidden">
            <Clock className="absolute right-[-20%] bottom-[-10%] w-64 h-64 text-[var(--color-muted)] opacity-[0.03]" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-[var(--color-muted)] uppercase mb-8">
                <Clock size={14} />
                Shift Insight
              </div>

              <div className="flex-1 flex flex-col justify-center gap-8">
                <div className="space-y-2 border-l-2 border-[var(--color-border)] pl-4">
                  <div className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Current Focus</div>
                  <div className="text-lg text-[var(--theme-text-main)]">
                    {inProgress > 0 ? 'Work through your active queue.' : assigned === 0 ? 'Standby for assignment.' : 'Address pending tickets.'}
                  </div>
                </div>

                <div className="space-y-2 border-l-2 border-[var(--color-border)] pl-4">
                  <div className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Escalation Load</div>
                  <div className="text-lg text-[var(--theme-text-main)]">
                    {escalated === 0 ? 'No escalations requested. Good work.' : `${escalated} ticket(s) required supervisor intervention.`}
                  </div>
                </div>

                <div className="space-y-2 border-l-2 border-[var(--color-border)] pl-4">
                  <div className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Efficiency</div>
                  <div className="text-lg text-[var(--theme-text-main)]">
                    {isOptimal ? 'Top tier. Maintain current velocity.' : isAcceptable ? 'Moderate. Look for process optimisations.' : 'Critically low. Escalate blockers immediately.'}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div >
  )
}