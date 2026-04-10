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
 * const { sectionData, isLoading, save, isSaving } = useScreeningSection({
 * childId,
 * cycleId,
 * sectionNumber: 1,
 * })
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner' // Using Sonner for global notifications
import { useActiveCycleQuery } from './useActiveCycleQuery'

/**
 * useScreeningSection
 * Handles all CRUD operations for individual screening sections (1-10).
 */
export function useScreeningSection({ childId, cycleId, sectionNumber }) {
  const queryClient = useQueryClient()
  const queryKey = ['screening-section', childId, cycleId, sectionNumber]

  // ── READ ──────────────────────────────────────────────────────────────────
  // Optimized to use a single join query instead of two separate hits
  const { data, isLoading, error } = useQuery({
    queryKey,
    enabled: !!childId && !!cycleId && !!sectionNumber,
    staleTime: 1000 * 30, // 30 seconds
    queryFn: async () => {
      // We join screening_sections with screenings to filter by child/cycle in one go
      const { data: section, error: secErr } = await supabase
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

      if (secErr) throw secErr
      return section
    },
  })

  // Real-time subscription for section updates
  useEffect(() => {
    if (!childId || !cycleId || !sectionNumber) return

    const channel = supabase
      .channel(`section-${childId}-${cycleId}-${sectionNumber}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'screening_sections',
        filter: `screenings.child_id=eq.${childId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, childId, cycleId, sectionNumber, queryKey])

  // ── WRITE ─────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async ({ sectionData, isComplete = false }) => {
      // Calls the PostgreSQL function we created to handle parent/child upsert
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

    // Handle UI Feedback automatically based on "Draft" vs "Complete"
    onSuccess: (data, variables) => {
      // 1. Refresh relevant data caches
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['screening-queue'] })
      queryClient.invalidateQueries({ queryKey: ['children-deep-search'] })
      queryClient.invalidateQueries({ queryKey: ['clinician-stats'] })

      // 2. Trigger the appropriate Toast
      if (variables.isComplete) {
        toast.success(`Section ${sectionNumber} marked as complete!`, {
          description: 'This section is now locked for review.',
          icon: '',
        })
      } else {
        toast.info('Progress saved as draft', {
          duration: 2000,
          description: 'You can come back and finish this later.',
        })
      }
    },

    onError: (err) => {
      toast.error('Save failed', {
        description: err.message || 'Please check your connection and try again.',
      })
    },
  })

  return {
    // Data mapping
    sectionData: data?.section_data ?? null,
    isComplete: data?.is_complete ?? false,
    completedAt: data?.completed_at ?? null,
    lastUpdated: data?.updated_at ?? null,
    
    // Status flags
    isLoading,
    isSaving: mutation.isPending,
    error,
    saveError: mutation.error,

    // Actions
    save: mutation.mutateAsync,
  }
}

/**
 * useActiveCycle
 * Helper to ensure we are always writing to the current clinic cycle.
 */
export function useActiveCycle() {
  return useActiveCycleQuery()
}
