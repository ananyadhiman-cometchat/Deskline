import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

const DISMISSED_KEY = 'deskline-notif-prompt-dismissed'

export function NotificationPermissionToast() {
  const { isAuthenticated } = useAuthStore()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show on web, when authenticated, and when permission hasn't been decided
    if (!isAuthenticated) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'default') return
    if (localStorage.getItem(DISMISSED_KEY) === 'true') return

    // Small delay so it doesn't flash immediately on login
    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [isAuthenticated])

  if (!visible) return null

  const handleEnable = async () => {
    setVisible(false)
    // This triggers the native browser permission prompt
    await Notification.requestPermission()
  }

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, 'true')
  }

  return (
    <div className="notif-permission-toast">
      <div className="notif-permission-toast-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </div>
      <div className="notif-permission-toast-content">
        <p className="notif-permission-toast-title">Enable Notifications</p>
        <p className="notif-permission-toast-body">
          Get instant alerts for ticket updates, assignments, and escalations.
        </p>
      </div>
      <div className="notif-permission-toast-actions">
        <button
          className="notif-permission-btn notif-permission-btn-enable"
          onClick={handleEnable}
        >
          Enable
        </button>
        <button
          className="notif-permission-btn notif-permission-btn-dismiss"
          onClick={handleDismiss}
        >
          Not Now
        </button>
      </div>
    </div>
  )
}
