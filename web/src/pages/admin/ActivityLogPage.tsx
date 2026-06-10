import { useState } from 'react'
import { useActivityLogs } from '@/hooks/useAdmin'
import { ActivityLogTable } from '@/components/admin/ActivityLogTable'
import { SkeletonLoader } from '@/components/ui/SkeletonLoader'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Pagination } from '@/components/ui/Pagination'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { ActivityLogFilters } from '@/types'
import { Activity } from 'lucide-react'

export default function ActivityLogPage() {
  const [filters, setFilters] = useState<ActivityLogFilters>({ page: 1, pageSize: 20 })
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading, isError, error } = useActivityLogs(filters)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Simplified search: we just put the input into entityType or action for now.
    // If it looks like a UUID, we could put it in entityId.
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchInput)
    
    if (isUUID) {
      setFilters({ page: 1, pageSize: 20 })
      // Currently our filter doesn't have entityId, but we can add it or just clear filters
    } else {
      setFilters({ ...filters, action: searchInput || undefined, page: 1 })
    }
  }

  const clearFilters = () => {
    setSearchInput('')
    setFilters({ page: 1, pageSize: 20 })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Activity Logs</h1>
        <p className="text-[var(--color-muted)]">Comprehensive immutable record of all system mutations.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-4 items-end bg-[var(--color-surface)] p-4 border border-[var(--color-border)]">
        <div className="flex-1 max-w-md">
          <Input 
            placeholder="Search by action (e.g. ticket_created)" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary">Filter</Button>
        {Object.keys(filters).length > 2 && (
          <Button type="button" variant="ghost" onClick={clearFilters}>Clear</Button>
        )}
      </form>

      {isError && <ErrorMessage error={error} title="Failed to load logs" />}

      {isLoading ? (
        <SkeletonLoader type="text" count={10} />
      ) : data?.data.length === 0 ? (
        <div className="p-12 text-center border border-[var(--color-border)]">
          <Activity className="mx-auto mb-4 h-8 w-8 text-[var(--color-muted)] opacity-50" />
          <p className="text-[var(--color-muted)]">No activity logs found.</p>
        </div>
      ) : (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
          <ActivityLogTable logs={data?.data || []} />
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
