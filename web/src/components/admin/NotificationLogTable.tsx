import type { Notification } from '@/types'
import { format } from 'date-fns'

export function NotificationLogTable({ logs }: { logs: Notification[] }) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'escalation': return 'text-[var(--color-brand-red)]'
      case 'announcement': return 'text-purple-600'
      case 'assignment': return 'text-[#10b981]'
      default: return 'text-[#3b82f6]'
    }
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Type</th>
            <th>Recipient ID</th>
            <th>Content</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="whitespace-nowrap text-xs text-[var(--color-muted)]">
                {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
              </td>
              <td>
                <span className={`text-xs font-bold uppercase tracking-wider ${getTypeColor(log.type)}`}>
                  {log.type.replace('_', ' ')}
                </span>
              </td>
              <td className="font-mono text-xs text-[var(--color-muted)]">
                {log.userId.slice(0, 8)}...
              </td>
              <td>
                <div className="font-semibold text-[var(--color-navy)]">{log.title}</div>
                <div className="text-xs text-[var(--color-muted)] line-clamp-1 max-w-md">{log.body}</div>
              </td>
              <td>
                {log.isRead ? (
                  <span className="text-xs font-semibold text-[#10b981]">Read</span>
                ) : (
                  <span className="text-xs font-semibold text-amber-500">Unread</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
