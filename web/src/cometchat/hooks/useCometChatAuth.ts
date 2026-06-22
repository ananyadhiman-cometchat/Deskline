import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { logCometChatError } from '../errors'

// ============================================================
// useCometChatAuth Hook
// ============================================================
// Fetches a CometChat auth token from the backend, handles
// refresh on expiry, and exposes auth state for the provider.
// ============================================================

interface CometChatAuthResponse {
  cometchatAuthToken: string
}

interface UseCometChatAuthReturn {
  /** The CometChat auth token, or null if unavailable */
  authToken: string | null
  /** Whether the token has been fetched successfully */
  isAuthenticated: boolean
  /** Error message if token fetch failed */
  error: string | null
  /** Whether the token is currently being fetched */
  isLoading: boolean
  /** Re-fetch the auth token from the backend (e.g., on expiry) */
  refreshToken: () => Promise<void>
}

const COMETCHAT_AUTH_QUERY_KEY = ['cometchat', 'auth-token'] as const

/**
 * Hook that fetches a CometChat auth token from the DeskLine backend.
 *
 * - Fetches on mount when the user is authenticated
 * - Provides a `refreshToken` function to re-fetch on expiry
 * - Uses TanStack Query for caching / deduplication
 * - The `api` axios instance auto-attaches the user's JWT
 */
export function useCometChatAuth(): UseCometChatAuthReturn {
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const {
    data,
    error: queryError,
    isLoading,
  } = useQuery({
    queryKey: COMETCHAT_AUTH_QUERY_KEY,
    queryFn: async (): Promise<string> => {
      const { data: responseData } = await api.post<CometChatAuthResponse>(
        '/api/cometchat/auth-token'
      )
      // The backend wraps in a data envelope in some cases
      const token =
        (responseData as { data?: { cometchatAuthToken?: string } })?.data?.cometchatAuthToken ??
        responseData.cometchatAuthToken
      if (!token) {
        throw new Error('Backend did not return a CometChat auth token.')
      }
      return token
    },
    // Only fetch when the user is logged in to DeskLine
    enabled: isAuthenticated,
    // Token doesn't go stale quickly — CometChat tokens last hours
    staleTime: 1000 * 60 * 30, // 30 minutes
    // Don't retry on 401/403 (handled globally), but retry once on network errors
    retry: 1,
  })

  // Re-fetch the token (e.g., when CometChat reports the token invalid)
  const refreshToken = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: COMETCHAT_AUTH_QUERY_KEY })
    } catch (e) {
      logCometChatError(e)
    }
  }, [queryClient])

  const errorMessage = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to fetch CometChat auth token.'
    : null

  // Log errors when they occur
  if (queryError) {
    logCometChatError(queryError)
  }

  return {
    authToken: data ?? null,
    isAuthenticated: !!data,
    error: errorMessage,
    isLoading,
    refreshToken,
  }
}
