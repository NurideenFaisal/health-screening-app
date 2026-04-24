import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { normalizeSectionOrder } from '../lib/sectionUtils'

export function useSectionDefinitions(sectionOrder = []) {
  const normalizedOrder = useMemo(() => (
    normalizeSectionOrder(sectionOrder)
  ), [JSON.stringify(sectionOrder)])

  const query = useQuery({
    queryKey: ['section-definitions', normalizedOrder.join(',')],
    enabled: normalizedOrder.length > 0,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('section_definitions')
        .select('section_number, name, short_name, description, color, display_order, tabs_config, is_active')
        .in('section_number', normalizedOrder)
        .eq('is_active', true)

      if (error) throw error

      const byNumber = new Map((data || []).map(section => [section.section_number, section]))

      return normalizedOrder
        .map(sectionNumber => byNumber.get(sectionNumber))
        .filter(Boolean)
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
