import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function ClinicianScreening_Data() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  // ─── Section from profile ─────────────────────────────────────────────────
  // profile.assignedSection = '1' | '2' | '3'
  const section = profile?.assignedSection ?? '1'

  const SIZE = {
    containerSpacing: "space-y-5",
    cardPadding: "p-4",
    innerPadding: "p-4",
    avatar: "w-9 h-9",
    headerIcon: "w-9 h-9",
    title: "text-lg",
    subtitle: "text-xs",
    name: "text-sm",
    meta: "text-xs"
  }

  // ─── Dummy data — swap with supabase query later ──────────────────────────
  const patients = [
    { id: 'GH0987-001', name: 'Kwame Mensah', gender: 'Male', age: 6, section1Complete: true,  section2Complete: true,  section3Complete: false },
    { id: 'GH0987-002', name: 'Ama Asante',   gender: 'Female', age: 5, section1Complete: true,  section2Complete: false, section3Complete: false },
    { id: 'GH0987-003', name: 'Kofi Owusu',   gender: 'Male', age: 4, section1Complete: false, section2Complete: false, section3Complete: false },
    { id: 'GH0987-004', name: 'Akua Boateng', gender: 'Female', age: 7, section1Complete: true,  section2Complete: true,  section3Complete: true  },
    { id: 'GH0987-005', name: 'Yaw Osei',     gender: 'Male', age: 6, section1Complete: false, section2Complete: false, section3Complete: false },
  ]

  // ─── Status logic per section ─────────────────────────────────────────────
  function getStatus(patient) {
    const { section1Complete, section2Complete, section3Complete } = patient

    if (section === '1') {
      if (section1Complete) return 'completed'
      return 'ready'
    }
    if (section === '2') {
      if (section2Complete) return 'completed'
      if (!section1Complete) return 'waiting'
      return 'ready'
    }
    if (section === '3') {
      if (section3Complete) return 'completed'
      if (!section2Complete) return 'waiting'
      return 'ready'
    }
    return 'waiting'
  }

  // ─── Status display config ────────────────────────────────────────────────
  const STATUS_CONFIG = {
    ready: {
      label: `Ready for Section ${section}`,
      badge: 'bg-blue-100 text-blue-700',
      dot: 'bg-blue-500',
      order: 0,
      clickable: true
    },
    waiting: {
      label: 'Waiting for previous section',
      badge: 'bg-amber-100 text-amber-700',
      dot: 'bg-amber-400',
      order: 1,
      clickable: false
    },
    completed: {
      label: 'Section complete',
      badge: 'bg-emerald-100 text-emerald-700',
      dot: 'bg-emerald-500',
      order: 2,
      clickable: false
    }
  }

  // ─── Filter → attach status → sort ───────────────────────────────────────
  const processedPatients = patients
    .filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.id.toLowerCase().includes(query.toLowerCase())
    )
    .map(p => ({ ...p, status: getStatus(p) }))
    .sort((a, b) => STATUS_CONFIG[a.status].order - STATUS_CONFIG[b.status].order)

  // ─── Click: only ready patients navigate ─────────────────────────────────
  function handlePatientClick(patient) {
    if (!STATUS_CONFIG[patient.status].clickable) return
    navigate(`/clinician/patient/${patient.id}`)
  }

  function initials(name) {
    return name[0].toUpperCase()
  }

  const counts = processedPatients.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})

  const SECTION_LABELS = {
    '1': 'Vitals / Immunization / Development',
    '2': 'Laboratory',
    '3': 'Summary & Diagnosis'
  }

  return (
    <div className={`w-full ${SIZE.containerSpacing}`}>

      {/* ── SEARCH CARD ───────────────────────────────────────────── */}
      <div className={`bg-white rounded-xl shadow ${SIZE.cardPadding} space-y-4`}>

        <div className="flex items-center gap-3">
          <div className={`${SIZE.headerIcon} bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0`}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.3-4.3m1.3-5.2A7 7 0 1110 3a7 7 0 018 8z" />
            </svg>
          </div>

          <div className="min-w-0">
            <h2 className={`${SIZE.title} font-bold text-gray-900`}>
              Screening Queue
            </h2>
            <p className={`text-gray-500 ${SIZE.subtitle} truncate`}>
              Section {section} — {SECTION_LABELS[section]}
            </p>
          </div>
        </div>

        <div className="relative">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or ID..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200
                       focus:ring-2 focus:ring-emerald-500 focus:outline-none text-gray-700 text-sm"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3.5"
            fill="none" stroke="currentColor" viewBox="0 0 20 20">
            <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-4.3-4.3m1.3-5.2A7 7 0 1110 3a7 7 0 018 8z" />
          </svg>
        </div>

        {/* Queue summary pills */}
        <div className="flex gap-2 flex-wrap">
          {counts.ready > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
              {counts.ready} Ready
            </span>
          )}
          {counts.waiting > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              {counts.waiting} Waiting
            </span>
          )}
          {counts.completed > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {counts.completed} Done
            </span>
          )}
        </div>

      </div>

      {/* ── PATIENT LIST ──────────────────────────────────────────── */}
      <div className={`bg-white rounded-xl shadow ${SIZE.innerPadding} space-y-3`}>

        <h3 className="text-sm font-semibold text-gray-700">
          {processedPatients.length} Patients
        </h3>

        {processedPatients.map(p => {
          const config = STATUS_CONFIG[p.status]

          return (
            <div
              key={p.id}
              onClick={() => handlePatientClick(p)}
              className={`
                flex items-center justify-between p-3 rounded-lg border transition
                ${config.clickable
                  ? 'border-gray-200 hover:border-emerald-400 hover:shadow-sm cursor-pointer'
                  : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                }
              `}
            >
              <div className="flex items-center gap-3 min-w-0">

                {/* Avatar */}
                <div className={`
                  ${SIZE.avatar} rounded-lg flex items-center justify-center font-semibold text-white flex-shrink-0
                  ${p.gender === 'Male' ? 'bg-blue-400' : p.gender === 'Female' ? 'bg-pink-400' : 'bg-gray-400'}
                `}>
                  {initials(p.name)}
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <p className={`font-semibold text-gray-900 ${SIZE.name} truncate`}>
                    {p.name}
                  </p>
                  <p className={`text-gray-500 ${SIZE.meta}`}>
                    {p.id} • {p.gender} • {p.age} yrs
                  </p>
                  <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dot} inline-block flex-shrink-0`} />
                    {config.label}
                  </span>
                </div>
              </div>

              {/* Right icon */}
              {config.clickable ? (
                <svg className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-2"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0 ml-2"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                </svg>
              )}
            </div>
          )
        })}

        {processedPatients.length === 0 && (
          <div className="text-center text-gray-500 py-6 text-sm">
            No patients match your search
          </div>
        )}

      </div>

    </div>
  )
}