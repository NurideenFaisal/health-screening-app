import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

const ENROLLMENT_QUEUE_KEY = 'patient_enrollment_queue'
const getEnrollmentQueue = () => { try { return JSON.parse(localStorage.getItem(ENROLLMENT_QUEUE_KEY) || '[]') } catch { return [] } }
const queueIdFor = (item) => item.id || item.child_code
const addToEnrollmentQueue = (item, userId) => {
  const id = queueIdFor(item)
  const q = getEnrollmentQueue().filter(i => queueIdFor(i) !== id)
  q.push({ ...item, _userId: userId })
  localStorage.setItem(ENROLLMENT_QUEUE_KEY, JSON.stringify(q))
}
const removeFromEnrollmentQueue = (id) => {
  const q = getEnrollmentQueue()
  const idx = q.findIndex(i => queueIdFor(i) === id)
  if (idx > -1) q.splice(idx, 1)
  localStorage.setItem(ENROLLMENT_QUEUE_KEY, JSON.stringify(q))
}
const cachePatient = (clinicId, patient) => {
  if (!clinicId || !patient?.child_code) return
  try {
    const key = `patients_${clinicId}`
    const patients = JSON.parse(localStorage.getItem(key) || '[]')
    const idx = patients.findIndex(p => (patient.id && p.id === patient.id) || p.child_code === patient.child_code)
    const next = { ...patient, id: patient.id || `local_${patient.child_code}`, offline_pending: true }
    if (idx > -1) patients[idx] = { ...patients[idx], ...next }
    else patients.unshift(next)
    localStorage.setItem(key, JSON.stringify(patients))
  } catch {}
}

async function syncPatient(item, userId) {
  const { id, clinic_id, created_by, _userId, ...payload } = item
  if (id && !String(id).startsWith('local_')) {
    const { error } = await supabase.from('children').update({ ...payload, updated_by: userId }).eq('id', id)
    if (error) throw error
    return
  }
  const { error } = await supabase.from('children').insert({ ...payload, created_by: created_by || userId, clinic_id })
  if (error) throw error
}

async function processEnrollmentQueue() {
  if (!navigator.onLine) return
  for (const item of getEnrollmentQueue()) {
    const id = queueIdFor(item)
    const userId = item._userId
    try {
      await syncPatient(item, userId)
      removeFromEnrollmentQueue(id)
    } catch { break }
  }
}

export function usePatientEnrollment({ profile }) {
  const queryClient = useQueryClient()
  const [syncStatus, setSyncStatus] = useState('synced')

  useEffect(() => {
    const handler = () => processEnrollmentQueue()
    window.addEventListener('online', handler)
    if (navigator.onLine) processEnrollmentQueue()
    return () => window.removeEventListener('online', handler)
  }, [])

  const saveEnrollment = useMutation({
    mutationFn: async (payload) => {
      const item = { ...payload, clinic_id: profile?.clinic_id, created_by: profile?.id }
      cachePatient(profile?.clinic_id, item)
      setSyncStatus('pending')
      if (!navigator.onLine) {
        addToEnrollmentQueue(item, profile?.id)
        return null
      }
      try {
        await syncPatient(item, profile?.id)
        setSyncStatus('synced')
        return item
      } catch {
        addToEnrollmentQueue(item, profile?.id)
        return null
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] })
      toast.success('Patient saved', { duration: 1500 })
    },
    onError: () => toast.error('Patient queued for sync', { description: 'Will save when connection returns' }),
  })

  return { saveEnrollment, syncStatus }
}