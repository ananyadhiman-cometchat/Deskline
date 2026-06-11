import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from './routes'
import { queryClient } from './lib/queryClient'
import { useMe } from './hooks/useAuth'
import { useEffect } from 'react'
import { useUIStore } from './store/uiStore'

function Toast() {
  const { toasts, removeToast } = useUIStore()

  useEffect(() => {
    const timers = toasts.map((toast) => setTimeout(() => removeToast(toast.id), toast.type === 'error' ? 6000 : 4000))
    return () => timers.forEach(clearTimeout)
  }, [toasts, removeToast])

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item toast-item-${t.type || 'info'}`}>
          <div className="toast-title">{t.title}</div>
          <div className="toast-message">{t.message}</div>
        </div>
      ))}
    </div>
  )
}

function AppRoot() {
  // Global auth rehydration trigger
  useMe()

  return <RouterProvider router={router} />
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toast />
      <AppRoot />
    </QueryClientProvider>
  )
}

export default App
