import { useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { normalizeSectionOrder } from '../lib/sectionUtils'

export function useSectionDefinitions(sectionOrder = []) {
  const queryClient = useQueryClient()
  const normalizedOrder = useMemo(() => normalizeSectionOrder(sectionOrder), [JSON.stringify(sectionOrder)])

  const query = useQuery({
    queryKey: ['section-definitions', normalizedOrder.join(',') || 'all'],
    enabled: true,
    staleTime: 1000 * 60 * 5,
    placeholderData: () => {
      try { return JSON.parse(localStorage.getItem('section_definitions_cache') || 'null') } catch { return undefined }
    },
    queryFn: async () => {
      let q = supabase.from('section_definitions').select('section_number, name, short_name, description, color, display_order, tabs_config, is_active').eq('is_active', true)
      if (normalizedOrder.length > 0) q = q.in('section_number', normalizedOrder)
      const { data, error } = await q
      if (error) throw error
      const byNumber = new Map((data || []).map(s => [s.section_number, s]))
      const result = normalizedOrder.length > 0
        ? normalizedOrder.map(n => byNumber.get(n)).filter(Boolean)
        : (data || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      try { localStorage.setItem('section_definitions_cache', JSON.stringify(result)) } catch {}
      return result
    },
  })

useEffect(() => {
    const channel = supabase
      .channel('section-defs-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'section_definitions' }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['section-definitions'] })
      })
      .subscribe((status, err) => {})
    return () => { 
      supabase.removeChannel(channel) 
    }
  }, [queryClient])

  const sectionMap = useMemo(() => new Map((query.data || []).map(s => [s.section_number, s])), [query.data])

  return { ...query, sections: query.data || [], sectionMap }
}