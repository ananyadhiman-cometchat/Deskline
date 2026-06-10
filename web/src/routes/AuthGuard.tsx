import { Navigate } from 'react-router-dom'
import { type ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types'

// ============================================================
// AuthGuard — protects routes requiring authentication
// ============================================================

interface AuthGuardProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, isHydrating, user } = useAuthStore()

  // Still checking auth state (calling /auth/me)
  if (isHydrating) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0F1923',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 28,
          letterSpacing: '0.05em',
          color: '#ffffff',
        }}>
          DESK<span style={{ color: '#FF4655' }}>LINE</span>
        </div>
        <div style={{
          width: 32,
          height: 2,
          background: '#FF4655',
          animation: 'none',
        }} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate home for their role
    const roleHome: Record<UserRole, string> = {
      employee: '/dashboard',
      agent: '/inbox',
      supervisor: '/tickets',
      admin: '/admin',
    }
    return <Navigate to={roleHome[user.role]} replace />
  }

  return <>{children}</>
}
