import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'
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
    "screened" → ALL sections are done                      (disabled — nothing left to do)

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
  const sectionNumber = parseInt(mySection, 10)

  // ── FETCH: Direct query to show all patients in the cycle ──────────────────────────
  const { data: queueData, isLoading, error: queryError } = useQuery({
    queryKey: ['screening-queue', mySection],
    queryFn: async () => {
      // 1. Get active cycle
      const { data: cycle, error: cycleError } = await supabase
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

      if (childrenError) {
        console.error('Error fetching children:', childrenError)
        throw childrenError
      }

      // 3. Get existing screening records for this cycle
      const { data: screenings, error: screeningsError } = await supabase
        .from('screenings')
        .select('id, child_id')
        .eq('cycle_id', cycle.id)

      // 4. Get screening_sections for completion status
      const screeningIds = screenings?.map(s => s.id) ?? []
      const { data: allSections, error: secErr } = screeningIds.length > 0
        ? await supabase
            .from('screening_sections')
            .select('screening_id, section_number, is_complete')
            .in('screening_id', screeningIds)
        : { data: [], error: null }

      // Build maps
      const screeningMap = {}
      screenings?.forEach(s => {
        screeningMap[s.child_id] = s.id
      })

      const sectionsMap = {}
      ;(allSections ?? []).forEach(sec => {
        const sId = sec.screening_id
        if (!sectionsMap[sId]) sectionsMap[sId] = {}
        sectionsMap[sId][`s${sec.section_number}`] = sec.is_complete
      })

      // 5. Build patient list - include ALL children, even without screening records
      const patients = (children ?? []).map(child => {
        const scrId = screeningMap[child.id]
        const sectionsObj = sectionsMap[scrId] ?? {}

        // Ensure all configured sections have a boolean value
        SECTIONS.forEach(s => {
          if (sectionsObj[`s${s.value}`] === undefined) {
            sectionsObj[`s${s.value}`] = false
          }
        })

        // Determine status: has any screening started?
        let status = 'ready'
        const hasStarted = scrId !== undefined
        const allComplete = SECTIONS.every(s => sectionsObj[`s${s.value}`] === true)
        
        if (allComplete) {
          status = 'screened'
        } else if (hasStarted) {
          // Check if this specific section is done
          status = sectionsObj[`s${mySection}`] === true ? 'done' : 'ready'
        }

        return {
          dbId: child.id,
          code: child.child_code,
          name: `${child.first_name} ${child.last_name}`,
          gender: child.gender === 'M' ? 'Male' : 'Female',
          ...sectionsObj,
          sections: sectionsObj,
          status,
        }
      })

      return { cycle, patients }
    },
    staleTime: 30000,
    refetchInterval: 5000,
    retry: 1,
  })

  const allPatients = queueData?.patients ?? []

  const filtered = allPatients
    .filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.code.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status])

  // Count per status for the stats strip
  const counts = allPatients.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})

  // Dynamic navigation path based on current section
  function handlePatientClick(patientId) {
    const pathSuffix = mySection === '1' ? '' : `/section${mySection}`
    navigate(`/clinician/patient/${patientId}${pathSuffix}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading queue…</p>
          {queryError && (
            <p className="text-red-500 text-sm mt-2">Error: {queryError.message}</p>
          )}
        </div>
      </div>
    )
  }

  // Get section pills for the legend
  const sectionPills = getSectionPills()

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-2xl mx-auto">

        {/* HEADER */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Section {mySection}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {getSectionLabel(mySection)}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
              queueData?.cycle
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-100 text-gray-400 border-gray-200'
            }`}>
              {queueData?.cycle
                ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{queueData.cycle.name}</>
                : 'No active cycle'
              }
            </span>
          </div>
        </div>

        {/* SECTION PILL LEGEND */}
        <div className="flex items-center gap-4 mb-4">
          <p className="text-xs text-gray-400 font-medium shrink-0">Key:</p>
          {sectionPills.map(({ key, label, doneColor, title }) => (
            <span key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`w-2.5 h-2.5 rounded-full ${doneColor}`} />
              {label} · {title}
            </span>
          ))}
        </div>

        {/* SEARCH */}
        <div className="mb-4">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-400 transition-all">
            <input
              className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
              placeholder="Search by name or beneficiary ID…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* NO ACTIVE CYCLE */}
        {!queueData?.cycle && (
          <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
            <p className="text-sm text-gray-400">No active screening cycle.</p>
            <p className="text-xs text-gray-300 mt-1">Contact admin.</p>
          </div>
        )}

        {/* PATIENT LIST */}
        {queueData?.cycle && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {filtered.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {filtered.map(p => {
                  const isDisabled = p.status === 'screened'
                  const isDoneHere = p.status === 'done'

                  return (
                    <li key={p.dbId}>
                      <button
                        disabled={isDisabled}
                        onClick={() => !isDisabled && handlePatientClick(p.dbId)}
                        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${
                          isDisabled
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          isDisabled
                            ? 'bg-gray-100 text-gray-400'
                            : isDoneHere
                              ? 'bg-emerald-100 text-emerald-600'
                              : p.gender === 'Female'
                                ? 'bg-pink-100 text-pink-600'
                                : 'bg-blue-100 text-blue-600'
                        }`}>
                          {isDisabled || isDoneHere ? '✓' : p.name[0]}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {p.name}
                            </p>

                            {/* Dynamic section completion pills */}
                            <div className="flex items-center gap-1 shrink-0">
                              {sectionPills.map(({ key, doneColor, title }) => (
                                <span
                                  key={key}
                                  title={`${title}: ${p.sections[key] ? 'complete' : 'pending'}`}
                                  className={`h-2 w-5 rounded-full transition-colors ${
                                    p.sections[key] ? doneColor : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-gray-400">{p.code}</span>
                            <span className={`text-xs ${
                              isDisabled ? 'text-gray-300'    :
                              isDoneHere ? 'text-emerald-500' :
                                           'text-gray-400'
                            }`}>
                              {isDisabled ? 'Screening complete'   :
                               isDoneHere ? 'Done at this station' :
                                            'Ready'}
                            </span>
                          </div>
                        </div>

                        {/* Chevron — only for actionable patients */}
                        {!isDisabled && (
                          <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="py-16 text-center">
                <p className="text-sm text-gray-400">No beneficiaries found</p>
                <p className="text-xs text-gray-300 mt-1">No patients registered for this cycle yet</p>
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <p className="text-xs text-gray-400 text-center mt-4">
          Patients may visit sections in any order · rotate to reduce congestion
        </p>

      </div>
    </div>
  )
}
