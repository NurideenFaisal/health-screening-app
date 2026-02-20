import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

const SECTION_LABELS = { '1': 'Vitals & Dev', '2': 'Laboratory', '3': 'Diagnosis' }
const STATUS_ORDER   = { ready: 0, waiting: 1, completed: 2 }
const STATUS_META    = {
  ready:     { label: s => `Ready · Section ${s}`, clickable: true  },
  waiting:   { label: _  => 'Awaiting previous section', clickable: false },
  completed: { label: _  => 'Complete',             clickable: false },
}

export default function ClinicianScreening_Data() {
  const [patients, setPatients]       = useState([])
  const [activeCycle, setActiveCycle] = useState(null)
  const [query, setQuery]             = useState('')
  const [loading, setLoading]         = useState(true)
  const navigate   = useNavigate()
  const { profile } = useAuthStore()
  const section = profile?.assignedSection ?? '1'

  useEffect(() => { fetchWorkspace() }, [])

  async function fetchWorkspace() {
    setLoading(true)

    const { data: cycle } = await supabase
      .from('cycles').select('*').eq('is_active', true).single()
    setActiveCycle(cycle)

    if (cycle) {
      const { data } = await supabase.from('children').select(`
        id, first_name, last_name, child_code, gender, birthdate,
        screenings!left(section1_complete, section2_complete, section3_complete)
      `).eq('screenings.cycle_id', cycle.id)

      if (data) {
        setPatients(data.map(p => ({
          dbId: p.id,
          id:   p.child_code,
          name: `${p.first_name} ${p.last_name}`,
          gender: p.gender === 'M' ? 'Male' : 'Female',
          age:  new Date().getFullYear() - new Date(p.birthdate).getFullYear(),
          s1: p.screenings[0]?.section1_complete || false,
          s2: p.screenings[0]?.section2_complete || false,
          s3: p.screenings[0]?.section3_complete || false,
        })))
      }
    }
    setLoading(false)
  }

  function getStatus(p) {
    if (section === '1') return p.s1 ? 'completed' : 'ready'
    if (section === '2') return p.s2 ? 'completed' : !p.s1 ? 'waiting' : 'ready'
    if (section === '3') return p.s3 ? 'completed' : !p.s2 ? 'waiting' : 'ready'
    return 'waiting'
  }

  const processed = patients
    .filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.id.toLowerCase().includes(query.toLowerCase())
    )
    .map(p => ({ ...p, status: getStatus(p) }))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])

  const counts = processed.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-sm text-gray-400">Loading queue…</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 lg:p-10 font-sans">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden w-full sm:max-w-lg sm:mx-auto lg:max-w-2xl">

        {/* ── Header ── */}
        <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-gray-100 space-y-3">

          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                Screening Queue
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Section {section} — {SECTION_LABELS[section]}
              </p>
            </div>

            {/* Cycle badge */}
            <span className={`text-xs font-medium px-2 py-1 rounded-xl whitespace-nowrap shrink-0
              ${activeCycle
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-gray-100 text-gray-400'}`}>
              {activeCycle ? `● ${activeCycle.name}` : 'No active cycle'}
            </span>
          </div>

          {/* Search */}
          <label className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 sm:py-2.5">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor"
              strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Name or patient ID…"
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none min-w-0"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 transition text-xs shrink-0">✕</button>
            )}
          </label>

          {/* Count summary */}
          <p className="text-xs text-gray-400">
            {counts.ready ?? 0} ready
            {counts.waiting   ? ` · ${counts.waiting} waiting`   : ''}
            {counts.completed ? ` · ${counts.completed} complete` : ''}
          </p>
        </div>

        {/* ── No cycle state ── */}
        {!activeCycle && (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-400">No active screening cycle.</p>
            <p className="text-xs text-gray-300 mt-1">Contact your administrator to start a cycle.</p>
          </div>
        )}

        {/* ── Patient list ── */}
        {activeCycle && (
          <ul>
            {processed.map((p, i) => {
              const meta = STATUS_META[p.status]
              return (
                <React.Fragment key={p.dbId}>
                  <li>
                    <button
                      onClick={() => meta.clickable && navigate(`/clinician/patient/${p.dbId}`)}
                      disabled={!meta.clickable}
                      className={`w-full flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-3.5 text-left transition group
                        ${meta.clickable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center
                        text-white text-sm font-bold shrink-0
                        ${p.gender === 'Female' ? 'bg-pink-400' : 'bg-blue-400'}
                        ${!meta.clickable ? 'opacity-30' : ''}`}>
                        {p.name[0]}
                      </div>

                      {/* Info */}
                      <div className={`flex-1 min-w-0 ${!meta.clickable ? 'opacity-40' : ''}`}>
                        <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {p.id} · {p.gender} · {p.age} yrs · {meta.label(section)}
                        </p>
                      </div>

                      {/* Chevron — only for ready rows */}
                      {meta.clickable ? (
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition shrink-0"
                          fill="none" stroke="currentColor" strokeWidth={2}
                          strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M9 5l7 7-7 7" />
                        </svg>
                      ) : (
                        <div className="w-4 h-4 shrink-0" />
                      )}
                    </button>
                  </li>

                  {i < processed.length - 1 && (
                    <div className="mx-4 sm:mx-6 border-t border-gray-100" />
                  )}
                </React.Fragment>
              )
            })}

            {processed.length === 0 && (
              <li className="py-10 sm:py-12 text-center text-sm text-gray-400">
                {query
                  ? <>No patients match <span className="font-medium text-gray-600">"{query}"</span></>
                  : 'No patients in this cycle yet'}
              </li>
            )}
          </ul>
        )}

        {/* ── Footer ── */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Only <span className="font-medium text-gray-600">ready</span> patients can be screened
          </p>
        </div>

      </div>
    </div>
  )
}