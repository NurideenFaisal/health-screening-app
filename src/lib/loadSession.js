import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'

export async function loadSession() {
  const { setAuth, clearAuth } = useAuthStore.getState()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    clearAuth()
    return
  }

  const user = session.user

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  setAuth(user, profile)
}