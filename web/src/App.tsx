import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from './routes'
import { queryClient } from './lib/queryClient'
import { useMe } from './hooks/useAuth'

function AppRoot() {
  // Global auth rehydration trigger
  useMe()

  return <RouterProvider router={router} />
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoot />
    </QueryClientProvider>
  )
}

export default App
