import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { loadSession } from './lib/loadSession'

// 1. Import TanStack Query tools
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 2. Create the client (The "Brain")
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes: Data won't trigger a "Loading" state if refreshed within this window
      cacheTime: 1000 * 60 * 30, // 30 minutes: Keeps the data in memory even if the component unmounts
      refetchOnWindowFocus: false, // Prevents refreshing every time you click back into the browser
    },
  },
})

// Load session remains as you had it
loadSession()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 3. Wrap your App with the Provider */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)