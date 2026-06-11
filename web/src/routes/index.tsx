import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGuard } from './AuthGuard'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { useAuthStore } from '@/store/authStore'

// Pages — lazy loaded for code splitting
import { lazy, Suspense } from 'react'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const EmployeeDashboard = lazy(() => import('@/pages/employee/DashboardPage'))
const RaiseTicketPage = lazy(() => import('@/pages/employee/RaiseTicketPage'))
const TicketDetailPage = lazy(() => import('@/pages/shared/TicketDetailPage'))
const NotificationCentrePage = lazy(() => import('@/pages/shared/NotificationCentrePage'))
const ProfilePage = lazy(() => import('@/pages/shared/ProfilePage'))
const AgentInboxPage = lazy(() => import('@/pages/agent/InboxPage'))
const AgentMetricsPage = lazy(() => import('@/pages/agent/AgentMetricsPage'))
const AllTicketsPage = lazy(() => import('@/pages/supervisor/AllTicketsPage'))
const AgentLoadPage = lazy(() => import('@/pages/supervisor/AgentLoadPage'))
const SupervisorDashboardPage = lazy(() => import('@/pages/supervisor/SupervisorDashboardPage'))
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const UserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage'))
const ActivityLogPage = lazy(() => import('@/pages/admin/ActivityLogPage'))
const NotificationLogPage = lazy(() => import('@/pages/admin/NotificationLogPage'))

function PageLoader() {
  return (
    <div style={{ padding: 32 }}>
      <div className="skeleton skeleton-title" style={{ width: 200, marginBottom: 24 }} />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
    </div>
  )
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  // --- Public routes ---
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <S><LoginPage /></S>,
      },
      {
        path: '/register',
        element: <S><RegisterPage /></S>,
      },
    ],
  },

  // --- Protected routes ---
  {
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      // Employee
      {
        path: '/dashboard',
        element: (
          <AuthGuard allowedRoles={['employee']}>
            <S><EmployeeDashboard /></S>
          </AuthGuard>
        ),
      },
      {
        path: '/tickets/raise',
        element: (
          <AuthGuard allowedRoles={['employee']}>
            <S><RaiseTicketPage /></S>
          </AuthGuard>
        ),
      },

      // Agent
      {
        path: '/inbox',
        element: (
          <AuthGuard allowedRoles={['agent']}>
            <S><AgentInboxPage /></S>
          </AuthGuard>
        ),
      },
      {
        path: '/agent/metrics',
        element: <S><AgentMetricsPage /></S>,
      },

      // Supervisor
      {
        path: '/supervisor/dashboard',
        element: (
          <AuthGuard allowedRoles={['supervisor']}>
            <S><SupervisorDashboardPage /></S>
          </AuthGuard>
        ),
      },
      {
        path: '/tickets',
        element: (
          <AuthGuard allowedRoles={['supervisor', 'admin']}>
            <S><AllTicketsPage /></S>
          </AuthGuard>
        ),
      },
      {
        path: '/agents/load',
        element: (
          <AuthGuard allowedRoles={['supervisor', 'admin']}>
            <S><AgentLoadPage /></S>
          </AuthGuard>
        ),
      },

      // Admin
      {
        path: '/admin',
        element: (
          <AuthGuard allowedRoles={['admin']}>
            <S><AdminDashboardPage /></S>
          </AuthGuard>
        ),
      },
      {
        path: '/admin/users',
        element: (
          <AuthGuard allowedRoles={['admin']}>
            <S><UserManagementPage /></S>
          </AuthGuard>
        ),
      },
      {
        path: '/admin/activity-logs',
        element: (
          <AuthGuard allowedRoles={['admin']}>
            <S><ActivityLogPage /></S>
          </AuthGuard>
        ),
      },
      {
        path: '/admin/notification-logs',
        element: (
          <AuthGuard allowedRoles={['admin']}>
            <S><NotificationLogPage /></S>
          </AuthGuard>
        ),
      },

      // Shared routes (all authenticated roles)
      {
        path: '/tickets/:id',
        element: <S><TicketDetailPage /></S>,
      },
      {
        path: '/notifications',
        element: <S><NotificationCentrePage /></S>,
      },
      {
        path: '/profile',
        element: <S><ProfilePage /></S>,
      },

      // Default redirect
      {
        index: true,
        path: '/',
        element: <RootRedirect />,
      },
    ],
  },

  // Catch-all
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])

function RootRedirect() {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  const roleHome: Record<string, string> = {
    employee: '/dashboard',
    agent: '/inbox',
    supervisor: '/tickets',
    admin: '/admin',
  }

  return <Navigate to={roleHome[user.role] ?? '/dashboard'} replace />
}
