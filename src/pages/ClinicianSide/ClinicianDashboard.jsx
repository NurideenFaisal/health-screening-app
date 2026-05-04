import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useActiveCycleQuery } from '../../hooks/useActiveCycleQuery'
import { useAuthStore } from '../../store/authStore'
import ClinicianSidebar from './ClinicianSidebar'
import { PageLoader } from '../../components/ui/primitives'

export default function ClinicianDashboard() {
  const { profile, user } = useAuthStore()
  const activeCycleQuery = useActiveCycleQuery()
  const activeCycle = activeCycleQuery.data ?? null
  const [banner, setBanner] = useState({ show: false, pending: 0, syncing: false, synced: false, storageFull: false })

  useEffect(() => {
    console.log('Preload check:', { clinicId: profile?.clinic_id, online: navigator.onLine, cycleId: activeCycle?.id, assignedSections: profile?.assigned_sections })
    if (!profile?.clinic_id || !navigator.onLine || !activeCycle?.id) return
    const preloadKey = `preload_complete_${profile.clinic_id}_${activeCycle.id}`
    if (localStorage.getItem(preloadKey) === 'true') return

    const preload = async () => {
      const assignedSections = Array.isArray(profile.assigned_sections) ? profile.assigned_sections : []
      await Promise.all(assignedSections.map(async section => {
        const sectionNumber = Number.parseInt(String(section), 10)
        if (!Number.isInteger(sectionNumber) || sectionNumber <= 0) return
        const { data } = await supabase.rpc('get_clinic_template', {
          p_clinic_id: profile.clinic_id, p_cycle_id: activeCycle.id, p_section_number: sectionNumber,
        })
        if (data?.fieldSchema) {
          localStorage.setItem(`template_${profile.clinic_id}_${activeCycle.id}_${sectionNumber}`, JSON.stringify(data.fieldSchema))
          localStorage.setItem(`template_${profile.clinic_id}_${sectionNumber}`, JSON.stringify(data.fieldSchema))
        }
      }))
      const { data: patients } = await supabase.rpc('search_clinic_patients', {
        search_term: '', target_cycle_id: activeCycle.id, target_clinic_id: profile.clinic_id,
      })
      if (patients) localStorage.setItem(`patients_${profile.clinic_id}`, JSON.stringify(patients))
      localStorage.setItem(preloadKey, 'true')
      toast.success('Ready for offline use')
    }
    preload().catch(error => console.warn('Offline preload failed:', error))
  }, [activeCycle?.id, profile?.clinic_id, profile?.assigned_sections])

  useEffect(() => {
    let syncedTimer, previousPending = 0
    const check = () => {
      let queue = []
      try { queue = JSON.parse(localStorage.getItem('screening_sync_queue') || '[]') } catch { queue = [] }
      const pending = queue.length
      const syncing = navigator.onLine && pending > 0
      const synced = navigator.onLine && previousPending > 0 && pending === 0
      previousPending = pending
      setBanner({ show: !navigator.onLine || pending > 0 || synced, pending, syncing, synced, storageFull: false })
      if (synced) {
        clearTimeout(syncedTimer)
        syncedTimer = setTimeout(() => setBanner(c => c.synced ? { show: false, pending: 0, syncing: false, synced: false, storageFull: false } : c), 2000)
      }
    }
    check()
    window.addEventListener('online', check)
    window.addEventListener('offline', check)
    const interval = setInterval(check, 3000)
    return () => {
      clearInterval(interval)
      clearTimeout(syncedTimer)
      window.removeEventListener('online', check)
      window.removeEventListener('offline', check)
    }
  }, [])

  useEffect(() => {
    const handler = () => {
      setBanner({ show: true, pending: 0, syncing: false, synced: false, storageFull: true })
    }
    window.addEventListener('storage-full', handler)
    return () => window.removeEventListener('storage-full', handler)
  }, [])

  if (!profile || !user) return <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 sm:p-6"><PageLoader /></div>

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <ClinicianSidebar />
      <div className="min-w-0 flex-1 overflow-y-auto pb-16 lg:pb-0">
        <div className="mt-14 p-4 sm:p-6 lg:mt-0">
          <div className="mx-auto w-full max-w-[1600px]">
            {banner.show && (
              <div className={`sticky top-0 z-30 mb-3 py-2 text-center text-xs text-white ${banner.storageFull ? 'bg-red-500' : banner.syncing || banner.synced ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                {banner.storageFull ? 'Storage full · Cannot save offline' : banner.synced ? 'All synced' : banner.syncing ? `Syncing ${banner.pending} items...` : `Offline · ${banner.pending} pending`}
              </div>
            )}
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
