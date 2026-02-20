import React from 'react'
import { NavLink, Outlet, useParams } from 'react-router-dom'

const TABS = [
  { label: 'Vitals',                    path: '' },
  { label: 'Immunization',              path: 'immunization' },
  { label: 'Development & Specialists', path: 'development' },
]

export default function ScreeningSection1({ screening, onComplete }) {
  const { id } = useParams()

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 lg:p-10 font-sans">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden w-full sm:max-w-lg sm:mx-auto lg:max-w-2xl">

        {/* Patient header */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">
            {screening?.child?.first_name} {screening?.child?.last_name}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {screening?.child?.child_code} · Section 1 — Vitals & Dev
          </p>
        </div>

        {/* Tab bar */}
        <div className="px-4 sm:px-6 border-b border-gray-100">
          <div className="flex gap-1">
            {TABS.map(tab => (
              <NavLink
                key={tab.path}
                to={tab.path === '' ? `/clinician/patient/${id}` : `/clinician/patient/${id}/${tab.path}`}
                end={tab.path === ''}
                className={({ isActive }) =>
                  `flex-1 text-center py-2 px-1 text-xs font-medium rounded-t-lg transition whitespace-nowrap
                  ${isActive
                    ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50'
                    : 'text-gray-400 hover:text-gray-600'}`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-4 sm:px-6 py-4">
          <Outlet context={{ screening, onComplete }} />
        </div>

      </div>
    </div>
  )
}