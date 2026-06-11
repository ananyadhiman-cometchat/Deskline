import { StatsCard } from '@/components/admin/StatsCard'
import { TicketAnalyticsChart } from '@/components/admin/TicketAnalyticsChart'
import { ActivityLogTable } from '@/components/admin/ActivityLogTable'
import { useActivityLogs, useAdminDashboard } from '@/hooks/useAdmin'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { data: dashboard } = useAdminDashboard()
  
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
        <StatsCard label="Total Users" value={dashboard?.totals.users ?? 0} />
        <StatsCard label="Total Tickets" value={dashboard?.totals.tickets ?? 0} accent />
        <StatsCard label="Unread Notifications" value={dashboard?.totals.unreadNotifications ?? 0} accent />
        <StatsCard label="Resolved Today" value={dashboard?.totals.resolvedToday ?? 0} />
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
          

          <TicketAnalyticsChart
            data={(dashboard?.ticketsByStatus ?? []).map((item, index) => ({
              name: item.status ?? 'Unknown',
              value: Object.values(item._count)[0] ?? 0,
              color: ['#3b82f6', '#10b981', '#6366f1', '#ef4444', '#f59e0b'][index % 5],
            }))}
          />
        </div>
      </div>
    </div>
  )
}
