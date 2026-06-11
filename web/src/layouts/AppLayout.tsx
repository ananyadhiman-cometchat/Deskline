import { useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { useUnreadCount } from '@/hooks/useNotifications'
import { LogOut, User as UserIcon, Bell, Menu, Inbox, Ticket, Users, Activity, ListOrdered, Shield, Sun, Moon } from 'lucide-react'
import type { UserRole } from '@/types'

// ============================================================
// AppLayout — Shell for authenticated users
// ============================================================

export function AppLayout() {
  const { user, logout } = useAuthStore()
  const { sidebarOpen, setSidebarOpen, toggleSidebar, theme, toggleTheme } = useUIStore()
  const unreadCount = useUnreadCount()
  const navigate = useNavigate()

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  if (!user) return null // Should be caught by AuthGuard

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Define navigation based on role
  const navItems: Array<{ label: string; to: string; icon: React.ReactNode; roles: UserRole[] }> = [
    { label: 'Dashboard', to: '/dashboard', icon: <Activity size={18} />, roles: ['employee'] },
    { label: 'My Tickets', to: '/tickets', icon: <Ticket size={18} />, roles: ['employee'] }, // Need to make sure /tickets lists 'own' tickets for employee
    { label: 'Inbox', to: '/inbox', icon: <Inbox size={18} />, roles: ['agent'] },
    { label: 'My Metrics', to: '/agent/metrics', icon: <Activity size={18} />, roles: ['agent'] },
    { label: 'Supervisor Dashboard', to: '/supervisor/dashboard', icon: <Activity size={18} />, roles: ['supervisor'] },
    { label: 'All Tickets', to: '/tickets', icon: <ListOrdered size={18} />, roles: ['supervisor', 'admin'] },
    { label: 'Agent Load', to: '/agents/load', icon: <Users size={18} />, roles: ['supervisor', 'admin'] },
    { label: 'Admin Dashboard', to: '/admin', icon: <Shield size={18} />, roles: ['admin'] },
    { label: 'Users', to: '/admin/users', icon: <Users size={18} />, roles: ['admin'] },
    { label: 'Activity Logs', to: '/admin/activity-logs', icon: <Activity size={18} />, roles: ['admin'] },
    { label: 'Notification Logs', to: '/admin/notification-logs', icon: <Bell size={18} />, roles: ['admin'] },
  ]

  const visibleNavItems = navItems.filter(item => item.roles.includes(user.role))

  return (
    <div className="app-shell">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'sidebar-overlay-visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
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
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}


        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={toggleSidebar}
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
              <UserIcon size={14} />
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
          <Outlet />
        </div>
      </main>
    </div>
  )
}
