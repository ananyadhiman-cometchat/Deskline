import { StatsCard } from '@/components/admin/StatsCard'
import { TicketAnalyticsChart } from '@/components/admin/TicketAnalyticsChart'
import { ActivityLogTable } from '@/components/admin/ActivityLogTable'
import { useActivityLogs } from '@/hooks/useAdmin'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  
  // Fetch a quick snapshot of recent logs for the dashboard
  const { data: logsData, isLoading: logsLoading } = useActivityLogs({ pageSize: 5 })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-header">Command Centre</h1>
        <p className="text-[var(--color-muted)]">Global system administration and oversight.</p>
      </div>

      {/* High-level stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Users" value="105" />
        <StatsCard label="Active Tickets" value="42" accent />
        <StatsCard label="Escalations" value="7" accent />
        <StatsCard label="Avg Resolution" value="4.2h" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
            <h2 className="section-label m-0">Recent Activity</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/activity-logs')}>
              View All
            </Button>
          </div>
          
          {logsLoading ? (
            <SkeletonLoader type="text" count={5} />
          ) : logsData?.data ? (
            <ActivityLogTable logs={logsData.data} />
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
            <h2 className="section-label m-0">System Alerts</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/notification-logs')}>
              Logs
            </Button>
          </div>
          
          <div className="card bg-red-50/10 border-l-[var(--color-brand-red)] p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 text-[var(--color-brand-red)] shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-[var(--color-brand-red)] uppercase tracking-wide">Step 2 Pending</h3>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  CometChat integration and Webhook event listeners are scheduled for the next deployment phase.
                </p>
              </div>
            </div>
          </div>
          
          <TicketAnalyticsChart />
        </div>
      </div>
    </div>
  )
}
