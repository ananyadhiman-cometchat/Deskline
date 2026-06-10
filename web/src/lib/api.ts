import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/types'

// ============================================================
// Axios API Client
// ============================================================

let _getAccessToken: (() => string | null) | null = null
let _clearAuth: (() => void) | null = null

/** Call this from the auth store setup to wire interceptors */
export function initApiClient(
  getAccessToken: () => string | null,
  clearAuth: () => void
) {
  _getAccessToken = getAccessToken
  _clearAuth = clearAuth
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
  withCredentials: true, // send httpOnly cookies (refresh token)
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// --- Request Interceptor: attach access token ---
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = _getAccessToken?.()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

// --- Response Interceptor: handle 401 with silent refresh ---
let isRefreshing = false
let refreshQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach(p => {
    if (error) {
      p.reject(error)
    } else if (token) {
      p.resolve(token)
    }
  })
  refreshQueue = []
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Only attempt refresh on 401, not on auth login or refresh endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/refresh') &&
      !originalRequest.url?.includes('/api/auth/login')
    ) {
      if (isRefreshing) {
        // Queue subsequent 401s until refresh completes
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = localStorage.getItem('deskline_refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const { data } = await api.post<any>('/api/auth/refresh', { refreshToken })
        const responseData = data.data ?? data
        const newToken = responseData.accessToken
        const newRefreshToken = responseData.refreshToken

        // Update the Zustand store (accessed via the bound setter)
        // We re-import to avoid circular deps — the store handles this via initApiClient
        const { useAuthStore } = await import('@/store/authStore')
        useAuthStore.getState().setAccessToken(newToken)

        if (newRefreshToken) {
          localStorage.setItem('deskline_refresh_token', newRefreshToken)
        }

        originalRequest.headers.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('deskline_refresh_token')
        processQueue(refreshError, null)
        _clearAuth?.()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ============================================================
// Typed API error helper
// ============================================================

export function isApiError(error: unknown): error is AxiosError<ApiError> {
  return axios.isAxiosError(error)
}

export function getApiErrorMessage(error: unknown): string {
  if (isApiError(error) && error.response?.data?.error?.message) {
    return error.response.data.error.message
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred.'
}

export function getApiErrorCode(error: unknown): string | null {
  if (isApiError(error) && error.response?.data?.error?.code) {
    return error.response.data.error.code
  }
  return null
}
