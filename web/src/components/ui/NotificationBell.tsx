import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function NotificationBell({ count }: { count: number }) {
  const navigate = useNavigate()

  return (
    <button 
      className="notification-bell"
      onClick={() => navigate('/notifications')}
      aria-label="Notifications"
    >
      <Bell size={18} color="var(--color-navy)" />
      {count > 0 && (
        <div className="notification-badge">{count > 99 ? '99+' : count}</div>
      )}
    </button>
  )
}
