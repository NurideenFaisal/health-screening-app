import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'

async function loadClinicName(profile) {
  if (!profile?.clinic_id) {
    return profile
  }

  const { data: clinic, error } = await supabase
    .from('clinics')
    .select('name')
    .eq('id', profile.clinic_id)
    .single()

  if (error) {
    return profile
  }

  return { ...profile, clinic_name: clinic?.name || profile.clinic_name }
}

export async function hydrateAuthSession(sessionOverride) {
  const { user, beginAuthLoad, setAuth, clearAuth } = useAuthStore.getState() 
  if (!user) {
    beginAuthLoad()
  }

  const session =
    sessionOverride !== undefined
      ? sessionOverride
      : (await supabase.auth.getSession()).data.session

  if (!session) {
    clearAuth()
    return { user: null, profile: null }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const profileWithClinic = await loadClinicName(profile)
  const resolvedProfile = error ? null : profileWithClinic

  setAuth(session.user, resolvedProfile)
  return { user: session.user, profile: resolvedProfile }
}
