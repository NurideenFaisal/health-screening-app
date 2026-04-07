import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'

export async function loadSession() {
  const { setAuth, clearAuth } = useAuthStore.getState()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    clearAuth()
    return
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  setAuth(session.user, error ? null : profile)
}
