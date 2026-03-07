import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'
import { Search, X, ChevronRight, Loader2 } from 'lucide-react'
import {
  SECTIONS,
  getSectionLabel,
  getSectionPills,
} from '../../config/sections'

/*
  STATUS LOGIC — ASYNC / ROTATION MODEL
  ──────────────────────────────────────
  No enforced section order. Patients rotate freely to whichever
  station has less congestion. Each station's independent:

    "ready"    → this station has NOT yet seen the patient  (clickable)
    "done"     → this station has completed their part      (clickable — allows corrections)
    "screened" → ALL sections are done                       (disabled — nothing left to do)

  Sort order: ready → done → screened
*/
function deriveStatus(sectionsObj, mySection) {
  // Check if ALL sections are complete
  const allComplete = SECTIONS.every(s => sectionsObj[`s${s.value}`] === true)
  if (allComplete) return 'screened'

  // Check if this specific section is done
  const doneHere = sectionsObj[`s${mySection}`] === true

  return doneHere ? 'done' : 'ready'
}

const STATUS_WEIGHT = { ready: 0, done: 1, screened: 2 }

export default function ClinicianScreeningData() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [query, setQuery] = useState('')

  const mySection = profile?.section ?? '1'

  // ── FETCH: Direct query to show all patients in the cycle ──────────────────────────
  const { data: queueData, isLoading, error: queryError } = useQuery({
    queryKey: ['screening-queue', mySection],
    queryFn: async () => {
      // 1. Get active cycle
      const { data: cycle } = await supabase
        .from('cycles')
        .select('id, name, is_active')
        .eq('is_active', true)
        .maybeSingle()

      if (!cycle) return { cycle: null, patients: [] }

      // 2. Get all children (patients) in the system
      const { data: children, error: childrenError } = await supabase
        .from('children')
        .select('id, child_code, first_name, last_name, gender, birthdate, community')
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })

      if (childrenError) throw childrenError

      // 3. Get existing screening records for this cycle
      const { data: screenings } = await supabase
        .from('screenings')
        .select('id, child_id, updated_at')
        .eq('cycle_id', cycle.id)

      // 4. Get screening_sections for completion status
      const screeningIds = screenings?.map(s => s.id) ?? []
      const { data: allSections } = screeningIds.length > 0
        ? await supabase
          .from('screening_sections')
          .select('screening_id, section_number, is_complete')
          .in('screening_id', screeningIds)
        : { data: [], error: null }

      // Build maps
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

      // 5. Build patient list - include ALL children
      const patients = (children ?? []).map(child => {
        const scrInfo = screeningMap[child.id]
        const scrId = scrInfo?.id
        const sectionsObj = sectionsMap[scrId] ?? {}

        // Ensure all configured sections have a boolean value
        SECTIONS.forEach(s => {
          if (sectionsObj[`s${s.value}`] === undefined) {
            sectionsObj[`s${s.value}`] = false
          }
        })

        // Determine status
        let status = 'ready'
        const hasStarted = scrId !== undefined
        const allComplete = SECTIONS.every(s => sectionsObj[`s${s.value}`] === true)

        if (allComplete) {
          status = 'screened'
        } else if (hasStarted) {
          status = sectionsObj[`s${mySection}`] === true ? 'done' : 'ready'
        }

        return {
          dbId: child.id,
          code: child.child_code,
          name: `${child.first_name} ${child.last_name}`,
          gender: child.gender === 'M' ? 'Male' : 'Female',
          updatedAt: scrInfo?.updated_at || '0',
          sections: sectionsObj,
          status,
        }
      })

      return { cycle, patients }
    },
    staleTime: 30000,
    refetchInterval: 5000,
  })

  // ── CRITICAL LOGIC: Small-Batch Queue + 2 Most Recent ────────────────────────────────────
  const filtered = useMemo(() => {
    const allPatients = queueData?.patients ?? []
    const searchTerm = query.toLowerCase().trim()

    // 1. SEARCH MODE: If typing, show top 10 matches
    if (searchTerm.length > 0) {
      return allPatients
        .filter(p =>
          p.name.toLowerCase().includes(searchTerm) ||
          p.code.toLowerCase().includes(searchTerm)
        )
        .sort((a, b) => STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status])
        .slice(0, 10)
    }

    // 2. IDLE MODE: Show Max 3 "Ready" and Max 2 "Recent Done"
    const readyPatients = allPatients
      .filter(p => p.status === 'ready')
      .slice(0, 3)

    const recentDone = allPatients
      .filter(p => p.status === 'done')
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 2)

    return [...readyPatients, ...recentDone]
  }, [query, queueData])

  if (isLoading) {
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

        {/* HEADER & SEARCH (Matching PatientSearch Style) */}
        <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-gray-100 space-y-3">
          <div className="flex items-start justify-between">

            {/* LEFT SIDE: Section Details */}
            <div className="flex flex-col">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                Section {mySection}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{getSectionLabel(mySection)}</p>
            </div>

            {/* RIGHT SIDE: Cycle & Progress Indicators */}
            <div className="flex flex-col items-end gap-1.5">
              {/* The Active Cycle - Now Right-Aligned & Titlecase */}
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-bold text-gray-400 capitalize tracking-widest text-right">
                  {queueData?.cycle?.name?.toLowerCase() || 'no active cycle'}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              </div>

              {/* Section Progress Indicators */}
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
            {query && <X size={14} className="text-gray-400 cursor-pointer" onClick={() => setQuery('')} />}
          </label>
        </div>

        {/* PATIENT LIST */}
        <ul className="divide-y divide-gray-100">
          {filtered.length > 0 ? (
            filtered.map((p, index) => {
              const isDisabled = p.status === 'screened'
              const isDoneHere = p.status === 'done'

              // Group Labels for Idle Mode
              const showReadyLabel = query.length === 0 && p.status === 'ready' && index === 0
              const showDoneLabel = query.length === 0 && p.status === 'done' &&
                (index === 0 || (filtered[index - 1]?.status === 'ready'))

              return (
                <React.Fragment key={p.dbId}>
                  {showReadyLabel && (
                    <li className="px-5 py-2 bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      Waiting in Rotation
                    </li>
                  )}
                  {showDoneLabel && (
                    <li className="px-5 py-2 bg-emerald-50/50 text-[10px] font-semibold text-emerald-600/60 uppercase tracking-wide">
                      Recently Completed
                    </li>
                  )}
                  <li>
                    <button
                      disabled={isDisabled}
                      onClick={() => !isDisabled && handlePatientClick(p.dbId)}
                      className={`w-full flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-3.5 transition-colors ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
                        }`}
                    >
                      {/* Avatar: matching your PatientSearch style */}
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
                          {/* Completion Pills */}
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