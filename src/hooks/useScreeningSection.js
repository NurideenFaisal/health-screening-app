/**
 * useScreeningSection
 *
 * Shared hook for reading and writing a single screening section.
 * All section components (Vitals, Lab, Diagnosis, etc.) use this hook.
 *
 * Reads from:  screening_sections (normalized table)
 * Writes via:  upsert_screening_section() RPC (atomic, creates parent row if needed)
 *
 * Usage:
 *   const { data, isLoading, save, isSaving } = useScreeningSection({
 *     childId,
 *     cycleId,
 *     sectionNumber: 1,
 *   })
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/**
 * @param {Object} params
 * @param {string}  params.childId       - UUID of the child (from children table)
 * @param {string}  params.cycleId       - UUID of the active cycle
 * @param {number}  params.sectionNumber - Section number (1, 2, 3, … 7)
 */
export function useScreeningSection({ childId, cycleId, sectionNumber }) {
  const queryClient = useQueryClient()
  const queryKey = ['screening-section', childId, cycleId, sectionNumber]

  // ── READ ──────────────────────────────────────────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey,
    enabled: !!childId && !!cycleId && !!sectionNumber,
    staleTime: 1000 * 30, // 30 seconds
    queryFn: async () => {
      // 1. Get the screening row for this child+cycle
      const { data: screening, error: sErr } = await supabase
        .from('screenings')
        .select('id')
        .eq('child_id', childId)
        .eq('cycle_id', cycleId)
        .maybeSingle()

      if (sErr) throw sErr
      if (!screening) return null // No screening record yet — form starts empty

      // 2. Get the section row
      const { data: section, error: secErr } = await supabase
        .from('screening_sections')
        .select('id, section_number, is_complete, section_data, completed_at, completed_by')
        .eq('screening_id', screening.id)
        .eq('section_number', sectionNumber)
        .maybeSingle()

      if (secErr) throw secErr
      return section // null if section not yet started
    },
  })

  // ── WRITE ─────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    /**
     * @param {Object} payload
     * @param {Object}  payload.sectionData  - The form data to save as JSONB
     * @param {boolean} payload.isComplete   - Whether to mark section as complete
     */
    mutationFn: async ({ sectionData, isComplete = false }) => {
      const { data: result, error } = await supabase.rpc('upsert_screening_section', {
        p_child_id:       childId,
        p_cycle_id:       cycleId,
        p_section_number: sectionNumber,
        p_section_data:   sectionData,
        p_is_complete:    isComplete,
      })
      if (error) throw error
      return result
    },
    onSuccess: () => {
      // Invalidate this section's cache
      queryClient.invalidateQueries({ queryKey })
      // Invalidate the screening queue (clinician list view)
      queryClient.invalidateQueries({ queryKey: ['screening-queue'] })
      // Invalidate clinician stats
      queryClient.invalidateQueries({ queryKey: ['clinician-stats'] })
    },
  })

  return {
    /** The current section_data JSONB (null if not yet saved) */
    sectionData: data?.section_data ?? null,
    /** Whether this section is marked complete */
    isComplete: data?.is_complete ?? false,
    /** Timestamp when section was completed */
    completedAt: data?.completed_at ?? null,
    /** Loading state for the read query */
    isLoading,
    /** Error from the read query */
    error,
    /**
     * Save section data.
     * @param {Object}  sectionData  - Form data to persist
     * @param {boolean} isComplete   - Mark section as complete
     */
    save: mutation.mutateAsync,
    /** Whether a save is in progress */
    isSaving: mutation.isPending,
    /** Error from the last save attempt */
    saveError: mutation.error,
  }
}

/**
 * useActiveCycle
 * Fetches the currently active screening cycle.
 * Used by section components to get the cycleId.
 */
export function useActiveCycle() {
  return useQuery({
    queryKey: ['active-cycle'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cycles')
        .select('id, name, is_active')
        .eq('is_active', true)
        .maybeSingle()
      if (error) throw error
      return data // null if no active cycle
    },
  })
}
