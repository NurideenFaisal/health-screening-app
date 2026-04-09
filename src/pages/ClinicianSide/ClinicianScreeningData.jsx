import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, X, ChevronRight, Loader2, WifiOff } from 'lucide-react'
import {
  SECTIONS,
  getSectionLabel,
  getSectionPills,
} from '../../config/sections'

const STATUS_WEIGHT = { done: 0, ready: 1, screened: 2 }

function withDefaultSections(sectionsObj = {}) {
  const next = { ...sectionsObj }
  SECTIONS.forEach(s => {
    if (next[`s${s.value}`] === undefined) {
      next[`s${s.value}`] = false
    }
  })
  return next
}

function buildPatient(child, screeningMap, sectionsMap, mySection) {
  const scrInfo = screeningMap[child.id]
  const scrId = scrInfo?.id
  const sections = withDefaultSections(sectionsMap[scrId])
  const allComplete = SECTIONS.every(s => sections[`s${s.value}`] === true)
  const doneHere = sections[`s${mySection}`] === true

  let status = 'ready'
  if (allComplete) {
    status = 'screened'
  } else if (doneHere) {
    status = 'done'
  }

  return {
    dbId: child.id,
    first_name: child.first_name,
    last_name: child.last_name,
    code: child.child_code,
    child_code: child.child_code,
    name: `${child.first_name} ${child.last_name}`,
    community: child.community,
    birthdate: child.birthdate,
    rawGender: child.gender,
    gender: child.gender === 'M' ? 'Male' : 'Female',
    updatedAt: scrInfo?.updated_at || '0',
    sections,
    status,
  }
}

export default function ClinicianScreeningData() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile, activeCycle, fetchActiveCycle } = useAuthStore()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const mySection = profile?.section ?? '1'
  const queueCacheKey = `clinician-screening-queue-${mySection}`

  const cachedQueueData = useMemo(() => {
    try {
      const raw = localStorage.getItem(queueCacheKey)
      return raw ? JSON.parse(raw) : undefined
    } catch {
      return undefined
    }
  }, [queueCacheKey])

  // Fetch active cycle once on mount (uses cached value if available)
  useEffect(() => {
    fetchActiveCycle()
  }, [])

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
      gender: patient.rawGender,
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

  // ── FETCH: Direct query to show all patients in the cycle ──────────────────────────
  const { data: queueData, isLoading, isFetching, error: queryError } = useQuery({
    queryKey: ['screening-queue', mySection],
    initialData: cachedQueueData,
    queryFn: async () => {
      // Use cached active cycle if available
      let cycle = activeCycle
      if (!cycle) {
        cycle = await fetchActiveCycle()
      }

      if (!cycle) {
        if (cachedQueueData) return cachedQueueData
        return { cycle: null, patients: [] }
      }

      const { data: screenings, error: screeningsError } = await supabase
        .from('screenings')
        .select('id, child_id, updated_at')
        .eq('cycle_id', cycle.id)

      if (screeningsError) throw screeningsError

      const screeningIds = screenings?.map(s => s.id) ?? []
      const childIds = [...new Set(screenings?.map(s => s.child_id).filter(Boolean) ?? [])]

      const { data: children, error: childrenError } = childIds.length > 0
        ? await supabase
          .from('children')
          .select('id, child_code, first_name, last_name, gender, birthdate, community')
          .in('id', childIds)
          .order('last_name', { ascending: true })
          .order('first_name', { ascending: true })
        : { data: [], error: null }

      if (childrenError) throw childrenError

      const { data: allSections, error: sectionsError } = screeningIds.length > 0
        ? await supabase
          .from('screening_sections')
          .select('screening_id, section_number, is_complete')
          .in('screening_id', screeningIds)
        : { data: [], error: null }

      if (sectionsError) throw sectionsError

      const screeningMap = {}
      screenings?.forEach(s => {
        screeningMap[s.child_id] = { id: s.id, updated_at: s.updated_at }
      })

      const sectionsMap = {}
      ; (allSections ?? []).forEach(sec => {
        const sId = sec.screening_id
        if (!sectionsMap[sId]) sectionsMap[sId] = {}
        sectionsMap[sId][`s${sec.section_number}`] = sec.is_complete
      })

      const patients = (children ?? []).map(child =>
        buildPatient(child, screeningMap, sectionsMap, mySection)
      )

      return { cycle, patients }
    },
    staleTime: 30000,
    refetchInterval: () => (navigator.onLine ? 5000 : false),
  })

  useEffect(() => {
    if (!queueData) return

    try {
      localStorage.setItem(queueCacheKey, JSON.stringify(queueData))
    } catch {
      // Ignore localStorage write failures and continue with in-memory cache.
    }
  }, [queueCacheKey, queueData])

  const localMatches = useMemo(() => {
    const searchTerm = debouncedQuery.toLowerCase()
    if (!searchTerm) return []

    return (queueData?.patients ?? [])
      .filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.code.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => {
        const byStatus = STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status]
        if (byStatus !== 0) return byStatus
        return new Date(b.updatedAt) - new Date(a.updatedAt)
      })
      .slice(0, 10)
  }, [debouncedQuery, queueData])

  const shouldRunRemoteSearch = debouncedQuery.length >= 3 && localMatches.length === 0

  const { data: remoteMatches = [], isFetching: isSearchingRemote } = useQuery({
    queryKey: ['children-deep-search', mySection, activeCycle?.id ?? 'no-cycle', debouncedQuery],
    enabled: shouldRunRemoteSearch,
    staleTime: 30000,
    queryFn: async () => {
      const cycle = activeCycle ?? await fetchActiveCycle()
      const searchTerm = debouncedQuery.trim()
      const searchPattern = `%${searchTerm}%`

      const { data: children, error: childrenError } = await supabase
        .from('children')
        .select('id, child_code, first_name, last_name, gender, birthdate, community')
        .or(`child_code.ilike.${searchPattern},first_name.ilike.${searchPattern},last_name.ilike.${searchPattern}`)
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })
        .limit(10)

      if (childrenError) throw childrenError

      if (!children?.length) return []

      const childIds = children.map(child => child.id)

      const { data: screenings, error: screeningsError } = cycle
        ? await supabase
          .from('screenings')
          .select('id, child_id, updated_at')
          .eq('cycle_id', cycle.id)
          .in('child_id', childIds)
        : { data: [], error: null }

      if (screeningsError) throw screeningsError

      const screeningIds = screenings?.map(s => s.id) ?? []
      const { data: allSections, error: sectionsError } = screeningIds.length > 0
        ? await supabase
          .from('screening_sections')
          .select('screening_id, section_number, is_complete')
          .in('screening_id', screeningIds)
        : { data: [], error: null }

      if (sectionsError) throw sectionsError

      const screeningMap = {}
      ; (screenings ?? []).forEach(s => {
        screeningMap[s.child_id] = { id: s.id, updated_at: s.updated_at }
      })

      const sectionsMap = {}
      ; (allSections ?? []).forEach(sec => {
        if (!sectionsMap[sec.screening_id]) sectionsMap[sec.screening_id] = {}
        sectionsMap[sec.screening_id][`s${sec.section_number}`] = sec.is_complete
      })

      return children.map(child => buildPatient(child, screeningMap, sectionsMap, mySection))
    },
  })

  useEffect(() => {
    if (!remoteMatches.length) return

    queryClient.setQueryData(['screening-queue', mySection], current => {
      const base = current ?? queueData ?? { cycle: activeCycle ?? null, patients: [] }
      const mergedPatients = [...(base.patients ?? [])]

      remoteMatches.forEach(match => {
        const existingIndex = mergedPatients.findIndex(patient => patient.dbId === match.dbId)
        if (existingIndex >= 0) {
          mergedPatients[existingIndex] = match
        } else {
          mergedPatients.push(match)
        }
      })

      return {
        ...base,
        cycle: base.cycle ?? activeCycle ?? null,
        patients: mergedPatients,
      }
    })
  }, [activeCycle, mySection, queryClient, queueData, remoteMatches])

  const filtered = useMemo(() => {
    const allPatients = queueData?.patients ?? []
    const searchTerm = debouncedQuery.toLowerCase().trim()

    if (searchTerm.length > 0) {
      return localMatches.length > 0 ? localMatches : remoteMatches
    }

    return allPatients
      .filter(p => p.status === 'done')
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
  }, [debouncedQuery, localMatches, queueData, remoteMatches])

  if (isLoading && !queueData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    )
  }

  const sectionPills = getSectionPills()

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 lg:p-10 font-sans">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden w-full sm:max-w-lg sm:mx-auto lg:max-w-2xl">

        {/* HEADER & SEARCH */}
        <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-gray-100 space-y-3">
          {queryError && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <WifiOff size={14} className="mt-0.5 shrink-0" />
              <div>
                Showing the last available queue data. Live refresh failed.
              </div>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                Section {mySection}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{getSectionLabel(mySection)}</p>
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
