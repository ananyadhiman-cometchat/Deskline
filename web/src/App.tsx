import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from './routes'
import { queryClient } from './lib/queryClient'
import { useMe } from './hooks/useAuth'
import { useUIStore } from './store/uiStore'

function Toast() {
  const { toastMessage, clearToast } = useUIStore()
  if (!toastMessage) return null
  window.setTimeout(clearToast, 4000)
  return <div style={{ position: 'fixed', right: '24px', bottom: '24px', background: '#0F1923', color: '#fff', padding: '12px 16px', borderLeft: '4px solid #FF4655', zIndex: 9999 }}>{toastMessage}</div>
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
