import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function usePatientRegistry() {
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()

  // Super-admin sees ALL patients (global), admins see only their clinic's patients
  const isSuperAdmin = profile?.role === 'super-admin'

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['patients', profile?.clinic_id],
    queryFn: async () => {
      let query = supabase
        .from('children')
        .select('*, screenings(count)')
        .order('created_at', { ascending: false })

      // Filter by clinic_id only if NOT super-admin
      // Super-admin (clinic_id = NULL) sees ALL children
      if (!isSuperAdmin && profile?.clinic_id) {
        query = query.eq('clinic_id', profile.clinic_id)
      }

      const { data, error } = await query
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
    enabled: !!profile, // Only run when profile is loaded
  })

  // Real-time subscription for children
  useEffect(() => {
    const channel = supabase
      .channel('children_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'children',
        filter: !isSuperAdmin && profile?.clinic_id ? `clinic_id=eq.${profile.clinic_id}` : undefined
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['patients'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, isSuperAdmin, profile?.clinic_id])

  const addPatient = useMutation({
    mutationFn: async (newPatient) => {
      // Automatically assign clinic_id for non-super-admin users
      const patientData = isSuperAdmin
        ? newPatient
        : { ...newPatient, clinic_id: profile?.clinic_id }

      const { error } = await supabase.from('children').insert(patientData)
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

  async function bulkAddPatients(rows) {
    const batchSize = 50
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).map(r => ({
        child_code: normalizeId(r.child_code),
        first_name: toTitleCase(r.first_name),
        last_name: toTitleCase(r.last_name),
        community: toTitleCase(r.community),
        birthdate: normalizeDate(r.birthdate),
        gender: normalizeSex(r.gender),
        clinic_id: profile?.clinic_id,
      }))
      const { error } = await supabase.from('children').upsert(batch, { onConflict: 'child_code' })
      if (error) throw error
    }
  }

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
    bulkAddPatients: bulkAddPatients.mutateAsync,
    deletePatients: deletePatients.mutateAsync,
    // Updated for v5
    isProcessing: addPatient.isPending || editPatient.isPending || bulkAddPatients.isPending || deletePatients.isPending
  }
}
