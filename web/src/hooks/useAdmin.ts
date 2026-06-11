import { api } from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  User,
  ActivityLog,
  Notification,
  ApiListResponse,
  ApiSingleResponse,
  UserFilters,
  ActivityLogFilters,
  CreateUserPayload,
  UpdateUserPayload,
} from '@/types'
import { useUIStore } from '@/store/uiStore'
import { getApiErrorMessage } from '@/lib/api'

// ============================================================
// Admin Hooks
// ============================================================

// --- Users ---

export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: async (): Promise<ApiListResponse<User>> => {
      const params = new URLSearchParams()
      if (filters.role) params.set('role', filters.role)
      if (filters.department) params.set('department', filters.department)
      if (filters.page) params.set('page', String(filters.page))
      if (filters.pageSize) params.set('pageSize', String(filters.pageSize))

      const { data } = await api.get<ApiListResponse<User>>(`/api/admin/users?${params}`)
      return data
    },
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  const showToast = useUIStore.getState().showToast

  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const { data } = await api.post<ApiSingleResponse<User>>('/api/admin/users', payload)
      return data.data
    },
    onSuccess: () => {
      showToast({ type: 'success', title: 'User Created', message: 'New user account created successfully.' })
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (error) => showToast({ type: 'error', title: 'User Creation Failed', message: getApiErrorMessage(error) })
  })
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient()
  const showToast = useUIStore.getState().showToast

  return useMutation({
    mutationFn: async (payload: UpdateUserPayload) => {
      const { data } = await api.patch<ApiSingleResponse<User>>(`/api/admin/users/${id}`, payload)
      return data.data
    },
    onSuccess: () => {
      showToast({ type: 'success', title: 'User Updated', message: 'User details updated successfully.' })
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (error) => showToast({ type: 'error', title: 'Update Failed', message: getApiErrorMessage(error) })
  })
}

export function useDeactivateUser(id: string) {
  const qc = useQueryClient()
  const showToast = useUIStore.getState().showToast

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch<ApiSingleResponse<User>>(`/api/admin/users/${id}/deactivate`)
      return data.data
    },
    onSuccess: () => {
      showToast({ type: 'warning', title: 'User Deactivated', message: 'User account has been disabled.' })
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (error) => showToast({ type: 'error', title: 'Deactivation Failed', message: getApiErrorMessage(error) })
  })
}

// --- Activity Logs ---

export function useActivityLogs(filters: ActivityLogFilters = {}) {
  return useQuery({
    queryKey: ['admin', 'activity-logs', filters],
    queryFn: async (): Promise<ApiListResponse<ActivityLog>> => {
      const params = new URLSearchParams()
      if (filters.userId) params.set('userId', filters.userId)
      if (filters.entityType) params.set('entityType', filters.entityType)
      if (filters.action) params.set('action', filters.action)
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)
      if (filters.page) params.set('page', String(filters.page))
      if (filters.pageSize) params.set('pageSize', String(filters.pageSize))

      const { data } = await api.get<ApiListResponse<ActivityLog>>(`/api/admin/activity-logs?${params}`)
      return data
    },
  })
}

// --- Notification Logs (Admin view) ---

export function useNotificationLogs(filters: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ['admin', 'notification-logs', filters],
    queryFn: async (): Promise<ApiListResponse<Notification>> => {
      const params = new URLSearchParams()
      if (filters.page) params.set('page', String(filters.page))
      if (filters.pageSize) params.set('pageSize', String(filters.pageSize))

      const { data } = await api.get<ApiListResponse<Notification>>(`/api/admin/notification-logs?${params}`)
      return data
    },
  })
}
