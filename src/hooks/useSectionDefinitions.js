import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { normalizeSectionOrder } from '../lib/sectionUtils'

export function useSectionDefinitions(sectionOrder = []) {
  const normalizedOrder = useMemo(() => (
    normalizeSectionOrder(sectionOrder)
  ), [JSON.stringify(sectionOrder)])

  // If sectionOrder is provided, filter by those sections
  // If empty, fetch ALL active sections
  const query = useQuery({
    queryKey: ['section-definitions', normalizedOrder.join(',') || 'all'],
    enabled: true, // Always enabled now
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      let query = supabase
        .from('section_definitions')
        .select('section_number, name, short_name, description, color, display_order, tabs_config, is_active')
        .eq('is_active', true)
      
      // Only filter by section numbers if specific ones are requested
      if (normalizedOrder.length > 0) {
        query = query.in('section_number', normalizedOrder)
      }

      const { data, error } = await query

      if (error) throw error

      const byNumber = new Map((data || []).map(section => [section.section_number, section]))

      // If specific order requested, maintain that order
      if (normalizedOrder.length > 0) {
        return normalizedOrder
          .map(sectionNumber => byNumber.get(sectionNumber))
          .filter(Boolean)
      }
      
      // Otherwise return all sections sorted by display_order
      return (data || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    },
  })

  const sectionMap = useMemo(() => {
    return new Map((query.data || []).map(section => [section.section_number, section]))
  }, [query.data])

  return {
    ...query,
    sections: query.data || [],
    sectionMap,
  }
}