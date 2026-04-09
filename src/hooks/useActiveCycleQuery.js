import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function useActiveCycleQuery() {
  const activeCycle = useAuthStore(state => state.activeCycle)
  const setActiveCycle = useAuthStore(state => state.setActiveCycle)

  const query = useQuery({
    queryKey: ['active-cycle'],
    staleTime: 1000 * 60 * 5,
    initialData: activeCycle ?? undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cycles')
        .select('id, name, is_active')
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error
      return data
    },
  })

  useEffect(() => {
    if (query.data) {
      setActiveCycle(query.data)
    }
  }, [query.data, setActiveCycle])

  return query
}
