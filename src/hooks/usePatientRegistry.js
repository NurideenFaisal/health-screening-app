import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function usePatientRegistry() {
  const queryClient = useQueryClient()

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select('*, screenings(count)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data.map(c => ({
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        community: c.community,
        dob: c.birthdate,
        childId: c.child_code,
        sex: c.gender,
        screenCount: c.screenings?.[0]?.count || 0,
        created_by: c.created_by,
      }))
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30, 
  })

  const addPatient = useMutation({
    mutationFn: async (newPatient) => {
      const { error } = await supabase.from('children').insert(newPatient)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  })

  const editPatient = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { error } = await supabase.from('children').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  })

  const deletePatients = useMutation({
    mutationFn: async (ids) => {
      const { error } = await supabase.from('children').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  })

  return {
    people,
    isLoading,
    addPatient: addPatient.mutateAsync,
    editPatient: editPatient.mutateAsync,
    deletePatients: deletePatients.mutateAsync,
    // Updated for v5
    isProcessing: addPatient.isPending || editPatient.isPending || deletePatients.isPending
  }
}