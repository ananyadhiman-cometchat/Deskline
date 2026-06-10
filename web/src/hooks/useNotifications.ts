import { api } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import type { Notification, ApiListResponse } from '@/types'
import { useMemo } from 'react'

// ============================================================
// Notification Hooks
// ============================================================

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<ApiListResponse<Notification>> => {
      // GET /api/notifications — backend auto-marks as read on fetch
      const { data } = await api.get<ApiListResponse<Notification>>('/api/notifications')
      return data
    },
    refetchInterval: 30_000, // poll every 30s for new notifications
  })
}

export function useUnreadCount() {
  const { data } = useNotifications()

  return useMemo(() => {
    if (!data || !Array.isArray(data.data)) return 0
    return data.data.filter((n) => !n.isRead).length
  }, [data])
}

