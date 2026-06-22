import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { useUIStore } from '@/store/uiStore'
import { useUnreadCount } from '@/hooks/useNotifications'
import { LogOut, User as UserIcon, Bell, Menu, Inbox, Ticket, Users, Activity, ListOrdered, Shield, Sun, Moon, Megaphone, ShieldAlert } from 'lucide-react'
import { CometChatProvider } from '@/cometchat/CometChatProvider'
import { IncomingCallHandler } from '@/cometchat/components/IncomingCallHandler'
import type { UserRole } from '@/types'

// ============================================================
// AppLayout — Shell for authenticated users
// ============================================================

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export function AppLayout() {
  const { user } = useAuthStore()
  const { sidebarOpen, setSidebarOpen, toggleSidebar, theme, toggleTheme } = useUIStore()
  const unreadCount = useUnreadCount()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { mutate: logoutMutation } = useLogout()
  // On desktop, sidebar is visible by default (sidebarOpen = true means visible)
  // On mobile, sidebar is hidden by default (sidebarOpen = true means open/visible)
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(true)

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  if (!user) return null // Should be caught by AuthGuard

  const handleLogout = () => {
    logoutMutation()
  }

  const handleToggleSidebar = () => {
    if (isMobile) {
      toggleSidebar()
    } else {
      setDesktopSidebarVisible((prev) => !prev)
    }
  }

  // Define navigation based on role
  const navItems: Array<{ label: string; to: string; icon: React.ReactNode; roles: UserRole[] }> = [
    { label: 'Dashboard', to: '/dashboard', icon: <Activity size={18} />, roles: ['employee'] },
    { label: 'My Tickets', to: '/tickets', icon: <Ticket size={18} />, roles: ['employee'] },
    { label: 'Inbox', to: '/inbox', icon: <Inbox size={18} />, roles: ['agent'] },
    { label: 'My Metrics', to: '/agent/metrics', icon: <Activity size={18} />, roles: ['agent'] },
    { label: 'Supervisor Dashboard', to: '/supervisor/dashboard', icon: <Activity size={18} />, roles: ['supervisor'] },
    { label: 'All Tickets', to: '/tickets', icon: <ListOrdered size={18} />, roles: ['supervisor', 'admin'] },
    { label: 'Agent Load', to: '/agents/load', icon: <Users size={18} />, roles: ['supervisor', 'admin'] },
    { label: 'Admin Dashboard', to: '/admin', icon: <Shield size={18} />, roles: ['admin'] },
    { label: 'Users', to: '/admin/users', icon: <Users size={18} />, roles: ['admin'] },
    { label: 'Activity Logs', to: '/admin/activity-logs', icon: <Activity size={18} />, roles: ['admin'] },
    { label: 'Notification Logs', to: '/admin/notification-logs', icon: <Bell size={18} />, roles: ['admin'] },
    { label: 'Announcements', to: '/admin/announcements', icon: <Megaphone size={18} />, roles: ['admin'] },
    { label: 'Moderation', to: '/admin/moderation', icon: <ShieldAlert size={18} />, roles: ['admin'] },
  ]

  const visibleNavItems = navItems.filter(item => item.roles.includes(user.role))

  // Sidebar class logic
  const sidebarClass = [
    'sidebar',
    isMobile && sidebarOpen ? 'sidebar-open' : '',
    !isMobile && !desktopSidebarVisible ? 'sidebar-hidden' : '',
  ].filter(Boolean).join(' ')

  const mainContentClass = [
    'main-content',
    !isMobile && !desktopSidebarVisible ? 'sidebar-hidden' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="app-shell">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen && isMobile ? 'sidebar-overlay-visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={sidebarClass}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-text">
            DESK<span className="sidebar-logo-accent">LINE</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          {visibleNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => { if (isMobile) setSidebarOpen(false) }}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}


        </nav>
      </aside>

      {/* Main Content */}
      <main className={mainContentClass}>
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={handleToggleSidebar}
              style={{ display: 'flex', padding: '0 8px', borderColor: 'transparent' }}
              aria-label="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>
            <div className="topbar-title">DeskLine Support Operations</div>
          </div>

          <div className="topbar-actions">
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={toggleTheme}
              style={{ padding: '0 8px', border: 'none' }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button 
              className="notification-bell"
              onClick={() => navigate('/notifications')}
              aria-label="Notifications"
            >
              <Bell size={18} color="var(--color-navy)" />
              {unreadCount > 0 && (
                <div className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</div>
              )}
            </button>

            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => navigate('/profile')}
              style={{ padding: '0 12px' }}
            >
              <UserIcon size={16} />
              {user.name.split(' ')[0]}
            </button>

            <button 
              className="btn btn-ghost btn-sm" 
              onClick={handleLogout}
              style={{ padding: '0 12px', border: 'none' }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          <CometChatProvider>
            <IncomingCallHandler />
            <Outlet />
          </CometChatProvider>
        </div>
      </main>
    </div>
  )
}
