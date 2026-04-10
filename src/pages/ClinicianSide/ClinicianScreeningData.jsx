import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, X, ChevronRight, Loader2, WifiOff } from 'lucide-react'
import { useActiveCycleQuery } from '../../hooks/useActiveCycleQuery'
import {
  getSectionLabel,
  getSectionPills,
} from '../../config/sections'

const STATUS_WEIGHT = { done: 0, ready: 1, screened: 2 }

const determinePatientStatus = (sections = {}, mySection) => {
  const allComplete = [1, 2, 3, 4].every(num => sections[`s${num}`] === true)
  if (allComplete) return 'screened'
  if (sections[`s${mySection}`] === true) return 'done'
  return 'ready'
}

const mapRpcPatient = (row, mySection) => ({
  ...row,
  dbId: row.db_id ?? row.id,
  code: row.child_code,
  name: `${row.first_name} ${row.last_name}`,
  gender: row.gender === 'M' ? 'Male' : row.gender === 'F' ? 'Female' : row.gender,
  status: determinePatientStatus(row.section_data, mySection),
  sections: row.section_data ?? {},
  updatedAt: row.last_updated ?? '0',
})

export default function ClinicianScreeningData() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const activeCycleQuery = useActiveCycleQuery()
  const activeCycle = activeCycleQuery.data ?? null
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const mySection = profile?.section ?? '1'
  const clinicId = profile?.clinic_id
  const activeCycleId = activeCycle?.id ?? 'none'
  const queueCacheKey = `clinician-queue-${clinicId ?? 'all'}-${mySection}-${activeCycleId}`

  const cachedQueueData = useMemo(() => {
    try {
      const raw = localStorage.getItem(queueCacheKey)
      return raw ? JSON.parse(raw) : undefined
    } catch {
      return undefined
    }
  }, [queueCacheKey])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 400)

    return () => window.clearTimeout(timeoutId)
  }, [query])

  // Moved inside the component so 'navigate' is in scope
  const handlePatientClick = (patient) => {
    // Navigate to the user's assigned section
    // Section 1 uses index route (vitals), others use section{2,3,4} paths
    const sectionPath = mySection === '1' ? '' : `section${mySection}`
    const patientSnapshot = {
      id: patient.dbId,
      first_name: patient.first_name,
      last_name: patient.last_name,
      child_code: patient.child_code,
      community: patient.community,
      birthdate: patient.birthdate,
      gender: patient.gender === 'Female' ? 'F' : 'M',
    }

    queryClient.setQueryData(['child', patient.dbId], current => current ?? patientSnapshot)
    if (activeCycle?.id) {
      queryClient.prefetchQuery({
        queryKey: ['screening-section', patient.dbId, activeCycle.id, Number(mySection)],
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
            .eq('screenings.child_id', patient.dbId)
            .eq('screenings.cycle_id', activeCycle.id)
            .eq('section_number', Number(mySection))
            .maybeSingle()

          if (error) throw error
          return data
        },
      })
    }

    navigate(`/clinician/patient/${patient.dbId}${sectionPath ? `/${sectionPath}` : ''}`, {
      state: { patient: patientSnapshot },
    })
  }

  const { data: queueData, isLoading, isFetching, error: queryError } = useQuery({
    queryKey: ['screening-queue', clinicId, mySection, activeCycleId],
    enabled: !activeCycleQuery.isLoading,
    initialData: cachedQueueData,
    queryFn: async () => {
      if (!activeCycle) return { cycle: null, patients: [] }

      const { data, error } = await supabase.rpc('search_clinic_patients', {
        search_term: '',
        target_cycle_id: activeCycle.id,
        target_clinic_id: clinicId,
      })

      if (error) throw error

      const patients = (data ?? []).map(row => mapRpcPatient(row, mySection))
      return { cycle: activeCycle, patients }
    },
    staleTime: 30000,
    refetchInterval: () => (navigator.onLine ? 10000 : false),
  })

  useEffect(() => {
    if (!queueData) return

    try {
      localStorage.setItem(queueCacheKey, JSON.stringify(queueData))
    } catch {
      // Ignore localStorage write failures and continue with in-memory cache.
    }
  }, [queueCacheKey, queueData])

  const shouldRunRemoteSearch = debouncedQuery.length >= 3

  const { data: remoteMatches = [], isFetching: isSearchingRemote } = useQuery({
    queryKey: ['children-deep-search', clinicId, activeCycleId, debouncedQuery],
    enabled: shouldRunRemoteSearch && !activeCycleQuery.isLoading,
    staleTime: 60000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_clinic_patients', {
        search_term: debouncedQuery,
        target_cycle_id: activeCycle?.id ?? null,
        target_clinic_id: clinicId,
      })

      if (error) throw error
      return (data ?? []).map(row => mapRpcPatient(row, mySection))
    },
  })

  const filtered = useMemo(() => {
    const searchTerm = debouncedQuery.toLowerCase().trim()
    if (searchTerm.length > 0) {
      const source = remoteMatches.length > 0 ? remoteMatches : (queueData?.patients ?? [])
      return source
        .filter(p =>
          p.name.toLowerCase().includes(searchTerm) ||
          p.child_code.toLowerCase().includes(searchTerm)
        )
        .sort((a, b) => STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status])
        .slice(0, 15)
    }

    return (queueData?.patients ?? [])
      .filter(p => p.status === 'done')
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
  }, [debouncedQuery, queueData, remoteMatches])

  if ((activeCycleQuery.isLoading || isLoading) && !queueData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    )
  }

  const sectionPills = getSectionPills()

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-10 font-sans">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden w-full max-w-[1440px] mx-auto">

        {/* HEADER & SEARCH */}
        <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-gray-100 space-y-3">
          {(queryError || activeCycleQuery.error) && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <WifiOff size={14} className="mt-0.5 shrink-0" />
              <div>
                Showing the last available queue data. Live refresh failed.
              </div>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex flex-col min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
                Section {mySection}
              </h2>
              <p className="text-sm text-slate-500 mt-1">{getSectionLabel(mySection)}</p>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-bold text-gray-400 capitalize tracking-widest text-right">
                  {queueData?.cycle?.name?.toLowerCase() || 'no active cycle'}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${(isFetching || isSearchingRemote) ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
              </div>

              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
                {sectionPills.map(p => (
                  <div key={p.key} className={`w-2 h-2 rounded-full ${p.doneColor}`} />
                ))}
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 sm:py-2.5">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or ID…"
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none min-w-0"
            />
            {isSearchingRemote && (
              <Loader2 size={14} className="text-gray-400 shrink-0 animate-spin" />
            )}
            {query && <X size={14} className="text-gray-400 cursor-pointer" onClick={() => setQuery('')} />}
          </label>
        </div>

        {/* PATIENT LIST */}
        <ul className="divide-y divide-gray-100">
          {filtered.length > 0 ? (
            filtered.map((p, index) => {
              const isDisabled = p.status === 'screened'
              const isDoneHere = p.status === 'done'
              const showDoneLabel = query.length === 0 && index === 0

              return (
                <React.Fragment key={p.dbId}>
                  {showDoneLabel && (
                    <li className="px-5 py-2 bg-emerald-50/50 text-[10px] font-semibold text-emerald-600/60 uppercase tracking-wide">
                      Recently Completed
                    </li>
                  )}
                  <li>
                    <button
                      disabled={isDisabled}
                      onClick={() => !isDisabled && handlePatientClick(p)}
                      className={`w-full flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-3.5 transition-colors ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${isDisabled ? 'bg-gray-200' :
                        isDoneHere ? 'bg-emerald-500' :
                          p.gender === 'Female' ? 'bg-pink-400' : 'bg-blue-400'
                        }`}>
                        {isDisabled || isDoneHere ? '✓' : p.name[0]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate tracking-tight TitleCase">
                            {p.name}
                          </p>
                          <div className="flex gap-1 shrink-0">
                            {sectionPills.map(({ key, doneColor }) => (
                              <div key={key} className={`h-1.5 w-4 rounded-full ${p.sections[key] ? doneColor : 'bg-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 font-mono">{p.code}</span>
                          <span className={`text-xs ${isDoneHere ? 'text-emerald-500 font-medium' : 'text-gray-400'}`}>
                            {isDoneHere ? 'Station complete' : 'Ready for entry'}
                          </span>
                        </div>
                      </div>

                      {!isDisabled && <ChevronRight size={16} className="text-gray-300" />}
                    </button>
                  </li>
                </React.Fragment>
              )
            })
          ) : (
            <li className="py-16 text-center">
              <p className="text-sm text-gray-400">No beneficiary found</p>
            </li>
          )}
        </ul>

        {/* FOOTER */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">Cloud Registry Synchronized</p>
        </div>
      </div>
    </div>
  )
}
