import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function useActiveCycleQuery() {
  const profile = useAuthStore(state => state.profile)

  return useQuery({
    queryKey: ['active-cycle', profile?.clinic_id],
    enabled: !!profile,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      let query = supabase
        .from('cycles')
        .select('id, name, is_active')
        .eq('is_active', true)
      
      if (profile?.clinic_id) {
        query = query.eq('clinic_id', profile.clinic_id)
      }
      
      const { data, error } = await query.maybeSingle()

      if (error) throw error
      return data
    },
  })
}
