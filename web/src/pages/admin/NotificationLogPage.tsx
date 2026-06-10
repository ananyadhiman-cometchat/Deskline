import { useState } from 'react'
import { useNotificationLogs } from '@/hooks/useAdmin'
import { NotificationLogTable } from '@/components/admin/NotificationLogTable'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Pagination } from '@/components/ui/Pagination'
import { Bell } from 'lucide-react'

export default function NotificationLogPage() {
  const [filters, setFilters] = useState<{ page: number; pageSize: number }>({ page: 1, pageSize: 20 })

  const { data, isLoading, isError, error } = useNotificationLogs(filters)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">System Notifications Log</h1>
        <p className="text-[var(--color-muted)]">Global record of all dispatched system alerts and push notifications.</p>
      </div>

      {isError && <ErrorMessage error={error} title="Failed to load notifications" />}

      {isLoading ? (
        <SkeletonLoader type="text" count={10} />
      ) : data?.data.length === 0 ? (
        <div className="p-12 text-center border border-[var(--color-border)]">
          <Bell className="mx-auto mb-4 h-8 w-8 text-[var(--color-muted)] opacity-50" />
          <p className="text-[var(--color-muted)]">No notification logs found.</p>
        </div>
      ) : (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
          <NotificationLogTable logs={data?.data || []} />
          {data?.meta && data.meta.total > data.meta.pageSize && (
            <Pagination
              page={data.meta.page}
              pageSize={data.meta.pageSize}
              total={data.meta.total}
              onPageChange={(page) => setFilters({ ...filters, page })}
            />
          )}
        </div>
      )}
    </div>
  )
}
