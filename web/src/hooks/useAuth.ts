import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/lib/queryClient'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { User } from '@/types'
import type { LoginFormValues, RegisterFormValues } from '@/lib/schemas'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import { getApiErrorMessage } from '@/lib/api'

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
  const showToast = useUIStore.getState().showToast
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
      showToast({ type: 'success', title: 'Login Successful', message: `Welcome back ${user.name}` })
      // Role-based redirect
      const redirects: Record<string, string> = {
        employee: '/dashboard',
        agent: '/inbox',
        supervisor: '/tickets',
        admin: '/admin',
      }
      navigate(redirects[user.role] ?? '/dashboard', { replace: true })
    },
    onError: (error) => showToast({ type: 'error', title: 'Login Failed', message: getApiErrorMessage(error) })
  })
}

export function useRegister() {
  const navigate = useNavigate()
  const showToast = useUIStore.getState().showToast

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
      showToast({ type: 'success', title: 'Registration Complete', message: 'Account created successfully.' })
      navigate('/login', { replace: true, state: { registered: true } })
    },
    onError: (error) => showToast({ type: 'error', title: 'Registration Failed', message: getApiErrorMessage(error) })
  })
}

export function useLogout() {
  const { logout } = useAuthStore()
  const showToast = useUIStore.getState().showToast
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('deskline_refresh_token')
      await api.post('/api/auth/logout', { refreshToken })
    },
    onSettled: () => {
      showToast({ type: 'info', title: 'Logged Out', message: 'Session ended successfully.' })
      localStorage.removeItem('deskline_refresh_token')
      logout()
      queryClient.clear()
      navigate('/login', { replace: true })
    },
  })
}

