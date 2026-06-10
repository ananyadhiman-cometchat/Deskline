import type { ActivityLog } from '@/types'
import { format } from 'date-fns'

export function ActivityLogTable({ logs }: { logs: ActivityLog[] }) {
  // Map raw backend action strings to readable labels based on SCHEMA.md examples
  const getActionLabel = (action: string) => {
    return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Action</th>
            <th>Entity Type</th>
            <th>Entity ID</th>
            <th>Metadata</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="whitespace-nowrap text-xs text-[var(--color-muted)]">
                {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
              </td>
              <td className="font-medium text-[var(--color-navy)]">
                {log.user ? `${log.user.name} (${log.user.role})` : 'System'}
              </td>
              <td>
                <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                  {getActionLabel(log.action)}
                </span>
              </td>
              <td className="uppercase tracking-wide text-xs">{log.entityType}</td>
              <td className="font-mono text-xs text-[var(--color-muted)]">
                {log.entityId.slice(0, 8)}...
              </td>
              <td className="text-xs text-[var(--color-muted)] max-w-xs truncate" title={JSON.stringify(log.metadata)}>
                {Object.keys(log.metadata || {}).length > 0 ? JSON.stringify(log.metadata) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
