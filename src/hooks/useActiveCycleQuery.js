import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function useActiveCycleQuery() {
  const { profile } = useAuthStore()
  const clinicId = profile?.clinic_id

  return useQuery({
    queryKey: ['active-cycle', clinicId],
    enabled: !!profile,
    queryFn: async () => {
      if (!clinicId) return null
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .single()
      if (error) throw error
      if (data) localStorage.setItem('active_cycle', JSON.stringify(data))
      return data
    },
    placeholderData: () => {
      try { return JSON.parse(localStorage.getItem('active_cycle') || 'null') } catch { return null }
    },
    staleTime: 60000,
  })
}
