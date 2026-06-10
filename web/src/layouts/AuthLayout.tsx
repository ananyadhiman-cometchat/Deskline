import { Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Navigate } from 'react-router-dom'

// ============================================================
// AuthLayout — Shell for public unauthenticated users
// ============================================================

export function AuthLayout() {
  const { isAuthenticated, isHydrating } = useAuthStore()

  if (isHydrating) {
    return (
      <div className="auth-layout">
        <div style={{ color: 'white' }}>Loading...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    // Prevent authenticated users from seeing login/register
    return <Navigate to="/" replace />
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-logo text-center">
          DESK<span className="auth-logo-accent">LINE</span>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
