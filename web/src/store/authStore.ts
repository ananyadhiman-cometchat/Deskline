import { create } from 'zustand'
import type { User } from '@/types'
import { initApiClient } from '@/lib/api'

// ============================================================
// Auth Store (Zustand)
// Access token lives in MEMORY only — never persisted.
// Refresh token is in httpOnly cookie managed by the browser.
// ============================================================

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isHydrating: boolean // true while calling /auth/me on app init
}

interface AuthActions {
  setAuth: (user: User, accessToken: string) => void
  setAccessToken: (accessToken: string) => void
  setHydrating: (value: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => {
  // Wire the API client interceptors once the store is created
  initApiClient(
    () => get().accessToken,
    () => set({ user: null, accessToken: null, isAuthenticated: false, isHydrating: false })
  )

  return {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isHydrating: true,

    setAuth: (user, accessToken) =>
      set({ user, accessToken, isAuthenticated: true, isHydrating: false }),

    setAccessToken: (accessToken) =>
      set({ accessToken }),

    setHydrating: (value) =>
      set({ isHydrating: value }),

    logout: () =>
      set({ user: null, accessToken: null, isAuthenticated: false, isHydrating: false }),
  }
})
