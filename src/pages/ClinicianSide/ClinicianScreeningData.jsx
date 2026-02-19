import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const patients = [
  { id: 'GH0987-001', name: 'Kwame Mensah',  gender: 'Male',   age: 6, section1Complete: true,  section2Complete: true,  section3Complete: false },
  { id: 'GH0987-002', name: 'Ama Asante',    gender: 'Female', age: 5, section1Complete: true,  section2Complete: false, section3Complete: false },
  { id: 'GH0987-003', name: 'Kofi Owusu',    gender: 'Male',   age: 4, section1Complete: false, section2Complete: false, section3Complete: false },
  { id: 'GH0987-004', name: 'Akua Boateng',  gender: 'Female', age: 7, section1Complete: true,  section2Complete: true,  section3Complete: true  },
  { id: 'GH0987-005', name: 'Yaw Osei',      gender: 'Male',   age: 6, section1Complete: false, section2Complete: false, section3Complete: false },
]

const SECTION_LABELS = {
  '1': 'Vitals / Immunization / Development',
  '2': 'Laboratory',
  '3': 'Summary & Diagnosis',
}

const STATUS_ORDER = { ready: 0, waiting: 1, completed: 2 }

function getStatus(patient, section) {
  const { section1Complete, section2Complete, section3Complete } = patient
  if (section === '1') return section1Complete ? 'completed' : 'ready'
  if (section === '2') return section2Complete ? 'completed' : !section1Complete ? 'waiting' : 'ready'
  if (section === '3') return section3Complete ? 'completed' : !section2Complete ? 'waiting' : 'ready'
  return 'waiting'
}

const STATUS_META = {
  ready:     { label: s => `Ready · Section ${s}`, clickable: true  },
  waiting:   { label: _  => 'Awaiting previous section', clickable: false },
  completed: { label: _  => 'Complete',             clickable: false },
}

export default function ClinicianScreening_Data() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const section = profile?.assignedSection ?? '1'

  const processed = patients
    .filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.id.toLowerCase().includes(query.toLowerCase())
    )
    .map(p => ({ ...p, status: getStatus(p, section) }))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])

  const counts = processed.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})

  return (
    // sm: centered card  |  mobile: full bleed with tiny padding
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 lg:p-10 font-sans">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden w-full sm:max-w-lg sm:mx-auto lg:max-w-2xl">

        {/* ── Header ── */}
        <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-gray-100 space-y-3 sm:space-y-4">

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                Screening Queue
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                Section {section} — {SECTION_LABELS[section]}
              </p>
            </div>
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
              {processed.length} patients
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
              <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 transition text-xs shrink-0">
                ✕
              </button>
            )}
          </label>

          {/* Count summary */}
          <p className="text-xs text-gray-400">
            {counts.ready ?? 0} ready
            {counts.waiting   ? ` · ${counts.waiting} waiting`   : ''}
            {counts.completed ? ` · ${counts.completed} complete` : ''}
          </p>
        </div>

        {/* ── Patient list ── */}
        <ul>
          {processed.map((p, i) => {
            const meta = STATUS_META[p.status]
            return (
              <li key={p.id}>
                <button
                  onClick={() => meta.clickable && navigate(`/clinician/patient/${p.id}`)}
                  disabled={!meta.clickable}
                  className={`
                    w-full flex items-center gap-3 text-left transition group
                    px-4 py-3 sm:px-6 sm:py-3.5
                    ${meta.clickable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}
                  `}
                >
                  {/* Avatar */}
                  <div className={`
                    w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center
                    text-white text-sm font-bold shrink-0
                    ${p.gender === 'Female' ? 'bg-pink-400' : 'bg-blue-400'}
                    ${!meta.clickable ? 'opacity-30' : ''}
                  `}>
                    {p.name[0]}
                  </div>

                  {/* Name + meta */}
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

                {i < processed.length - 1 && (
                  <div className="mx-4 sm:mx-6 border-t border-gray-100" />
                )}
              </li>
            )
          })}

          {processed.length === 0 && (
            <li className="py-10 sm:py-12 text-center text-sm text-gray-400">
              No patients match <span className="font-medium text-gray-600">"{query}"</span>
            </li>
          )}
        </ul>

        {/* ── Footer ── */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Tap a patient to begin their screening
          </p>
        </div>

      </div>
    </div>
  )
}