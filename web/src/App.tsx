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

  return <div style={{position:'fixed',right:'24px',bottom:'24px',display:'flex',flexDirection:'column',gap:'12px',zIndex:9999}}>{toasts.map(t => <div key={t.id} style={{background:'#fff',minWidth:'320px',border:'1px solid #E5E7EB',borderLeft:`4px solid ${t.type==='error'?'#FF4655':t.type==='success'?'#22c55e':t.type==='warning'?'#f59e0b':'#0F1923'}`,padding:'12px'}}><div style={{fontWeight:700}}>{t.title}</div><div>{t.message}</div></div>)}</div>
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
