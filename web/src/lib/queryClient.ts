import { QueryClient } from '@tanstack/react-query'
import { getApiErrorMessage } from '@/lib/api'

// ============================================================
// TanStack Query Client
// ============================================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,       // 2 minutes
      gcTime: 1000 * 60 * 10,          // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401, 403, 404
        if (typeof error === 'object' && error !== null && 'response' in error) {
          const status = (error as { response: { status: number } }).response?.status
          if ([401, 403, 404].includes(status)) return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        // Global mutation error — individual hooks can override
        console.error('[Mutation Error]', getApiErrorMessage(error))
      },
    },
  },
})
