import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'

/*
  SECTION LABELS
  Maps section number → human-readable name
*/
const SECTION_LABELS = {
  '1': 'Vitals & Dev',
  '2': 'Laboratory',
  '3': 'Diagnosis'
}

/*
  SECTION PILLS
  Each section gets a unique colour pill on the patient row.
  Coloured = that section is done. Grey = not yet done.
*/
const SECTION_PILLS = [
  { key: 's1', label: 'S1', doneColor: 'bg-violet-400', title: 'Vitals & Dev' },
  { key: 's2', label: 'S2', doneColor: 'bg-sky-400',    title: 'Laboratory'  },
  { key: 's3', label: 'S3', doneColor: 'bg-amber-400',  title: 'Diagnosis'   }
]

/*
  STATUS LOGIC — ASYNC / ROTATION MODEL
  ──────────────────────────────────────
  No enforced section order. Patients rotate freely to whichever
  station has less congestion. Each station's status is independent:

    "ready"    → this station has NOT yet seen the patient  (clickable)
    "done"     → this station has completed their part      (clickable — allows corrections)
    "screened" → ALL three sections are done                (disabled — nothing left to do)

  Sort order: ready → done → screened
*/
function deriveStatus(s1, s2, s3, mySection) {
  if (s1 && s2 && s3) return 'screened'

  const doneHere =
    mySection === '1' ? s1 :
    mySection === '2' ? s2 : s3

  return doneHere ? 'done' : 'ready'
}

const STATUS_WEIGHT = { ready: 0, done: 1, screened: 2 }

export default function ClinicianScreeningData() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [query, setQuery] = useState('')

  const mySection = profile?.section ?? '1'

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['screening-queue', mySection],
    queryFn: async () => {

      // 1. Fetch active cycle
      const { data: cycle } = await supabase
        .from('cycles')
        .select('*')
        .eq('is_active', true)
        .maybeSingle()

      if (!cycle) return { cycle: null, patients: [] }

      // 2. Fetch children + their screening record for this cycle
      const { data, error } = await supabase
        .from('children')
        .select(`
          id,
          first_name,
          last_name,
          child_code,
          gender,
          birthdate,
          screenings!left(
            id,
            section1_complete,
            section2_complete,
            section3_complete,
            cycle_id
          )
        `)
        .eq('screenings.cycle_id', cycle.id)

      if (error) throw error

      return {
        cycle,
        patients: data.map(child => {
          const s = child.screenings?.[0] || {}

          const s1 = s.section1_complete || false
          const s2 = s.section2_complete || false
          const s3 = s.section3_complete || false

          return {
            dbId:   child.id,
            code:   child.child_code,
            name:   `${child.first_name} ${child.last_name}`,
            gender: child.gender === 'M' ? 'Male' : 'Female',
            s1, s2, s3,
            status: deriveStatus(s1, s2, s3, mySection)
          }
        })
      }
    },
    refetchInterval: 5000
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

  function handlePatientClick(patientId) {
    const paths = { '1': '', '2': '/section2', '3': '/section3' }
    navigate(`/clinician/patient/${patientId}${paths[mySection]}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading queue…</p>
        </div>
      </div>
    )
  }

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
                {SECTION_LABELS[mySection]}
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
          {SECTION_PILLS.map(({ key, label, doneColor, title }) => (
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

                            {/* S1 · S2 · S3 completion pills */}
                            <div className="flex items-center gap-1 shrink-0">
                              {SECTION_PILLS.map(({ key, doneColor, title }) => (
                                <span
                                  key={key}
                                  title={`${title}: ${p[key] ? 'complete' : 'pending'}`}
                                  className={`h-2 w-5 rounded-full transition-colors ${
                                    p[key] ? doneColor : 'bg-gray-200'
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