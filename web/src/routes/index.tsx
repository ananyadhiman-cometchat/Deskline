import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGuard } from './AuthGuard'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'

// Pages — lazy loaded for code splitting with auto-retry on stale chunks
import { Suspense } from 'react'
import { lazyWithRetry } from '@/utils/lazyWithRetry'

const LoginPage = lazyWithRetry(() => import('@/pages/LoginPage'))
const RegisterPage = lazyWithRetry(() => import('@/pages/RegisterPage'))
const EmployeeDashboard = lazyWithRetry(() => import('@/pages/employee/DashboardPage'))
const RaiseTicketPage = lazyWithRetry(() => import('@/pages/employee/RaiseTicketPage'))
const TicketDetailPage = lazyWithRetry(() => import('@/pages/shared/TicketDetailPage'))
const NotificationCentrePage = lazyWithRetry(() => import('@/pages/shared/NotificationCentrePage'))
const ProfilePage = lazyWithRetry(() => import('@/pages/shared/ProfilePage'))
const LandingPage = lazyWithRetry(() => import('@/pages/LandingPage'))
const AgentInboxPage = lazyWithRetry(() => import('@/pages/agent/InboxPage'))
const AgentMetricsPage = lazyWithRetry(() => import('@/pages/agent/AgentMetricsPage'))
const AgentConversationsPage = lazyWithRetry(() => import('@/pages/agent/ConversationsPage'))
const AllTicketsPage = lazyWithRetry(() => import('@/pages/supervisor/AllTicketsPage'))
const AgentLoadPage = lazyWithRetry(() => import('@/pages/supervisor/AgentLoadPage'))
const SupervisorDashboardPage = lazyWithRetry(() => import('@/pages/supervisor/SupervisorDashboardPage'))
const MyTicketsPage = lazyWithRetry(() => import('@/pages/supervisor/MyTicketsPage'))
const AdminDashboardPage = lazyWithRetry(() => import('@/pages/admin/AdminDashboardPage'))
const UserManagementPage = lazyWithRetry(() => import('@/pages/admin/UserManagementPage'))
const ActivityLogPage = lazyWithRetry(() => import('@/pages/admin/ActivityLogPage'))
const NotificationLogPage = lazyWithRetry(() => import('@/pages/admin/NotificationLogPage'))
const AnnouncementsPage = lazyWithRetry(() => import('@/pages/admin/AnnouncementsPage'))
const ModerationPage = lazyWithRetry(() => import('@/pages/admin/ModerationPage'))

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

  // --- Landing Page ---
  {
    path: '/',
    element: <S><LandingPage /></S>,
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
        path: '/agent/conversations',
        element: (
          <AuthGuard allowedRoles={['agent']}>
            <S><AgentConversationsPage /></S>
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
        path: '/supervisor/my-tickets',
        element: (
          <AuthGuard allowedRoles={['supervisor']}>
            <S><MyTicketsPage /></S>
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
      {
        path: '/admin/announcements',
        element: (
          <AuthGuard allowedRoles={['admin']}>
            <S><AnnouncementsPage /></S>
          </AuthGuard>
        ),
      },
      {
        path: '/admin/moderation',
        element: (
          <AuthGuard allowedRoles={['admin']}>
            <S><ModerationPage /></S>
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

    ],
  },

  // Catch-all
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
