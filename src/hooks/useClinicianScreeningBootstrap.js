import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useActiveCycleQuery } from './useActiveCycleQuery'

export function useClinicianScreeningBootstrap({ childId, sectionNumber, initialPatient = null }) {
  const queryClient = useQueryClient()
  const activeCycleQuery = useActiveCycleQuery()

  const patientQuery = useQuery({
    queryKey: ['child', childId],
    enabled: !!childId,
    initialData: initialPatient ?? undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('id', childId)
        .single()

      if (error) throw error
      return data
    },
  })

  const cycleId = activeCycleQuery.data?.id ?? null

  const sectionQuery = useQuery({
    queryKey: ['screening-section', childId, cycleId, sectionNumber],
    enabled: !!childId && !!cycleId && !!sectionNumber,
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('screening_sections')
        .select(`
          id,
          section_number,
          is_complete,
          section_data,
          completed_at,
          completed_by,
          updated_at,
          screenings!inner(child_id, cycle_id)
        `)
        .eq('screenings.child_id', childId)
        .eq('screenings.cycle_id', cycleId)
        .eq('section_number', sectionNumber)
        .maybeSingle()

      if (error) throw error
      return data
    },
  })

  const bootstrapError = patientQuery.error ?? activeCycleQuery.error ?? sectionQuery.error ?? null
  const isBootstrapping =
    patientQuery.isLoading ||
    activeCycleQuery.isLoading ||
    (!!cycleId && sectionQuery.isLoading)

  const patient = patientQuery.data ?? initialPatient ?? null

  const retryBootstrap = useCallback(async () => {
    const [, cycleResult] = await Promise.all([
      patientQuery.refetch(),
      activeCycleQuery.refetch(),
    ])

    const nextCycleId = cycleResult.data?.id ?? activeCycleQuery.data?.id ?? null
    if (nextCycleId) {
      await queryClient.invalidateQueries({
        queryKey: ['screening-section', childId, nextCycleId, sectionNumber],
      })
    }
  }, [activeCycleQuery, childId, patientQuery, queryClient, sectionNumber])

  return {
    patient,
    cycle: activeCycleQuery.data ?? null,
    cycleId,
    section: sectionQuery.data ?? null,
    isBootstrapping,
    bootstrapError,
    retryBootstrap,
  }
}
