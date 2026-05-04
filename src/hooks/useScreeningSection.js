import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

const SYNC_QUEUE_KEY = 'screening_sync_queue'
const getSyncQueue = () => { try { return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]') } catch { return [] } }
const addToSyncQueue = (item) => {
  const q = getSyncQueue().filter(i => i.id !== item.id)
  q.push(item)
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(q))
}
const removeFromSyncQueue = (id) => {
  const q = getSyncQueue()
  const idx = q.findIndex(i => i.id === id)
  if (idx > -1) q.splice(idx, 1)
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(q))
}
const saveLocally = (key, data) => { try { localStorage.setItem(key, JSON.stringify(data)) } catch { } }
const loadLocally = (key) => { try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : null } catch { return null } }

async function processSyncQueue() {
  if (!navigator.onLine) return
  for (const item of getSyncQueue()) {
    const { id, ...params } = item
    try { await supabase.rpc('upsert_screening_section', params); removeFromSyncQueue(id) } catch { break }
  }
}


export function useScreeningSection({ childId, cycleId, sectionNumber }) {
  const queryClient = useQueryClient()
  const localKey = `screening_${childId}_${cycleId}_${sectionNumber}`
  const [syncStatus, setSyncStatus] = useState('synced')

  const { data, isLoading, error } = useQuery({
    queryKey: ['screening-section', childId, cycleId, sectionNumber],
    enabled: !!childId && !!cycleId && !!sectionNumber,
    staleTime: 1000 * 30,
    queryFn: async () => {
      try {
        const { data: section } = await supabase.from('screening_sections')
          .select(`id, section_number, is_complete, section_data, completed_at, completed_by, updated_at, screenings!inner(child_id, cycle_id)`)
          .eq('screenings.child_id', childId).eq('screenings.cycle_id', cycleId).eq('section_number', sectionNumber).maybeSingle()
        if (section) { saveLocally(localKey, section); return section }
      } catch { }
      return loadLocally(localKey) || null
    },
  })

  useEffect(() => {
    if (!childId || !cycleId || !sectionNumber) return
    const channel = supabase.channel(`section-${childId}-${cycleId}-${sectionNumber}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'screening_sections', filter: `screenings.child_id=eq.${childId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['screening-section', childId, cycleId, sectionNumber] })
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [queryClient, childId, cycleId, sectionNumber])

  useEffect(() => {
    const handler = () => processSyncQueue()
    window.addEventListener('online', handler)
    // Also process queue on mount if online
    if (navigator.onLine) processSyncQueue()
    return () => window.removeEventListener('online', handler)
  }, [])

  const mutation = useMutation({
    mutationFn: async ({ sectionData, isComplete = false }) => {
      saveLocally(localKey, { ...data, section_data: sectionData, is_complete: isComplete })
      setSyncStatus('pending')
      const rpcParams = { p_child_id: childId, p_cycle_id: cycleId, p_section_number: sectionNumber, p_section_data: sectionData, p_is_complete: isComplete }
      if (!navigator.onLine) { addToSyncQueue({ id: `${childId}_${cycleId}_${sectionNumber}`, ...rpcParams }); return null }
      try {
        const { data: result } = await supabase.rpc('upsert_screening_section', rpcParams)
        setSyncStatus('synced')
        return result
      } catch { addToSyncQueue({ id: `${childId}_${cycleId}_${sectionNumber}`, ...rpcParams }); return null }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screening-section', childId, cycleId, sectionNumber] })
      queryClient.invalidateQueries({ queryKey: ['screening-queue'] })
      toast.success('Saved', { duration: 1500 })
    },
    onError: () => toast.error('Save queued for sync', { description: 'Will save when connection returns' }),
  })

  return { sectionData: data?.section_data ?? null, isComplete: data?.is_complete ?? false, isLoading, isSaving: mutation.isPending, syncStatus, error, save: mutation.mutateAsync }
}
