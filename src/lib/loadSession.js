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

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Handle case where profile doesn't exist or has NULL clinic_id (super-admin)
  // We proceed even without a profile - the app will handle it
  setAuth(user, error ? null : profile)
}