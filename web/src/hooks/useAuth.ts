import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/lib/queryClient'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { User } from '@/types'
import type { LoginFormValues, RegisterFormValues } from '@/lib/schemas'
import { useNavigate } from 'react-router-dom'

// ============================================================
// Auth Hooks
// ============================================================

/** Rehydrate auth state on app mount by calling /auth/me */
export function useMe() {
  const { setAuth, setHydrating } = useAuthStore()

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<User> => {
      try {
        const { data } = await api.get<any>('/api/auth/me')
        const userData = data.data ?? data
        const token = useAuthStore.getState().accessToken ?? ''
        setAuth(userData, token)
        return userData
      } catch (err) {
        setHydrating(false)
        throw new Error('Not authenticated')
      }
    },
    retry: false,
    enabled: true,
  })
}

export function useLogin() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (payload: LoginFormValues) => {
      const { data } = await api.post<any>('/api/auth/login', payload)
      return data.data ?? data
    },
    onSuccess: (data) => {
      const user = data.user
      const accessToken = data.accessToken
      const refreshToken = data.refreshToken

      if (refreshToken) {
        localStorage.setItem('deskline_refresh_token', refreshToken)
      }
      setAuth(user, accessToken)
      // Role-based redirect
      const redirects: Record<string, string> = {
        employee: '/dashboard',
        agent: '/inbox',
        supervisor: '/tickets',
        admin: '/admin',
      }
      navigate(redirects[user.role] ?? '/dashboard', { replace: true })
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (payload: RegisterFormValues) => {
      const { data } = await api.post<any>('/api/auth/register', payload)
      return data.data ?? data
    },
    onSuccess: (data) => {
      const refreshToken = data.refreshToken
      if (refreshToken) {
        localStorage.setItem('deskline_refresh_token', refreshToken)
      }
      navigate('/login', { replace: true, state: { registered: true } })
    },
  })
}

export function useLogout() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('deskline_refresh_token')
      await api.post('/api/auth/logout', { refreshToken })
    },
    onSettled: () => {
      localStorage.removeItem('deskline_refresh_token')
      logout()
      queryClient.clear()
      navigate('/login', { replace: true })
    },
  })
}

