import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'
import {
  SECTIONS,
  getSectionLabel,
  getSectionPills,
  getAllSectionColumns,
} from '../../config/sections'

/*
  STATUS LOGIC — ASYNC / ROTATION MODEL
  ──────────────────────────────────────
  No enforced section order. Patients rotate freely to whichever
  station has less congestion. Each station's status is independent:

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

// Dynamic section column names for Supabase query
const SECTION_COLUMNS = getAllSectionColumns()

export default function ClinicianScreeningData() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [query, setQuery] = useState('')

  const mySection = profile?.section ?? '1'

  const { data: workspace, isLoading, error: queryError } = useQuery({
    queryKey: ['screening-queue', mySection],
    queryFn: async () => {

      // 1. Fetch active cycle
      const { data: cycle } = await supabase
        .from('cycles')
        .select('*')
        .eq('is_active', true)
        .maybeSingle()

      if (!cycle) return { cycle: null, patients: [] }

      // 2. Build dynamic select query for all section columns
      // Format: screenings!left(id, section1_complete, section2_complete, ...)
      const sectionColumns = SECTION_COLUMNS.join(', ')
      const selectFields = [
        'id',
        'first_name',
        'last_name',
        'child_code',
        'gender',
        'birthdate',
        `screenings!left(id, ${sectionColumns}, cycle_id)`
      ].join(', ')

      // 3. Fetch children + their screening record for this cycle
      const { data, error } = await supabase
        .from('children')
        .select(selectFields)
        .eq('screenings.cycle_id', cycle.id)

      if (error) {
        console.error('Error fetching patients:', error)
        throw error
      }

      // Process the data - handle different response structures
      return {
        cycle,
        patients: (data || []).map(child => {
          // Handle both array and object response for screenings
          const s = Array.isArray(child.screenings) 
            ? (child.screenings[0] || {})
            : (child.screenings || {})

          // Dynamically build sections object from all configured sections
          const sectionsObj = {}
          SECTIONS.forEach(sectionConfig => {
            const key = `s${sectionConfig.value}`
            const dbColumn = `section${sectionConfig.value}_complete`
            sectionsObj[key] = s[dbColumn] || false
          })

          return {
            dbId: child.id,
            code: child.child_code,
            name: `${child.first_name} ${child.last_name}`,
            gender: child.gender === 'M' ? 'Male' : 'Female',
            ...sectionsObj,
            sections: sectionsObj,
            status: deriveStatus(sectionsObj, mySection)
          }
        })
      }
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 5000,
    retry: 1
  })

  const allPatients = workspace?.patients || []

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
    // For section 1, use empty path (default), for others use /sectionN
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
              workspace?.cycle
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-100 text-gray-400 border-gray-200'
            }`}>
              {workspace?.cycle
                ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{workspace.cycle.name}</>
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
        {!workspace?.cycle && (
          <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
            <p className="text-sm text-gray-400">No active screening cycle.</p>
            <p className="text-xs text-gray-300 mt-1">Contact admin.</p>
          </div>
        )}

        {/* PATIENT LIST */}
        {workspace?.cycle && (
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
