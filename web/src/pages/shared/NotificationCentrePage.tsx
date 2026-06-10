import { useNotifications } from '@/hooks/useNotifications'
import { Card } from '@/components/ui/Card'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Bell, CheckCircle2, AlertTriangle, Info, ShieldAlert } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationCentrePage() {
  const { data, isLoading, isError, error } = useNotifications()

  const getIcon = (type: string) => {
    switch (type) {
      case 'assignment': return <CheckCircle2 className="h-5 w-5 text-[#10b981]" />
      case 'escalation': return <AlertTriangle className="h-5 w-5 text-[var(--color-brand-red)]" />
      case 'announcement': return <ShieldAlert className="h-5 w-5 text-purple-600" />
      case 'ticket_update':
      default: return <Info className="h-5 w-5 text-[#3b82f6]" />
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="page-header">Notification Centre</h1>
        <p className="text-[var(--color-muted)]">System alerts and ticket updates.</p>
      </div>

      {isError && <ErrorMessage error={error} title="Failed to load notifications" />}

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonLoader type="card" count={4} />
        </div>
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12 text-[var(--color-muted)] opacity-50" />}
          title="All Caught Up"
          description="You have no notifications at this time."
        />
      ) : (
        <div className="space-y-3">
          {data?.data.map((notification) => (
            <Card key={notification.id} className={!notification.isRead ? 'border-l-4 border-[var(--color-brand-red)]' : 'opacity-70'}>
              <div className="flex gap-4">
                <div className="mt-1 shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-bold ${!notification.isRead ? 'text-[var(--color-navy)]' : 'text-[var(--color-muted)]'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-[var(--color-muted)]">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-muted)]">{notification.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
