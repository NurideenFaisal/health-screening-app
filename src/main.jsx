import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
    },
  },
})

async function init() {
  const { setAuth, clearAuth } = useAuthStore.getState()

  // ── 1. Load the session once on startup ────────────────────────────────────
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    setAuth(session.user, profile)
  } else {
    clearAuth()
  }

  // ── 2. Listen for token refreshes & sign in/out events ────────────────────
  // This keeps your store in sync whenever Supabase silently refreshes the JWT
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setAuth(session.user, profile)
    } else {
      clearAuth()
    }
  })

  // ── 3. Render only after session is resolved ───────────────────────────────
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  )
}

init()