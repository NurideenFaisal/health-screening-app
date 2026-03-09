import React, { useEffect } from 'react'
import { useParams, useNavigate, NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { ChevronLeft } from 'lucide-react'
import { getSectionByValue } from '../../config/sections'

export default function ClinicianScreeningForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile, activeCycle, fetchActiveCycle } = useAuthStore()
  const mySection = String(profile?.section || '1')
  const sectionNumber = parseInt(mySection, 10)

  // Get current section configuration
  const currentSection = getSectionByValue(mySection)
  const tabs = currentSection?.tabs || []

  // Fetch patient
  const { data: patient } = useQuery({
    queryKey: ['child', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children').select('*').eq('id', id).single()
      if (error) throw error
      return data
    },
  })

  // Fetch active cycle once on mount (uses cached value if available)
  useEffect(() => {
    if (!activeCycle) {
      fetchActiveCycle()
    }
  }, [])

  // Context for child components
  const contextValue = {
    patientId: id,
    patient,
    cycleId: activeCycle?.id ?? null,
    sectionNumber,
    mySection,
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* ── Sticky header ── */}
      
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">

        {/* Patient row */}
        <div className="px-4 sm:px-6 py-3 flex items-center gap-3">

          {/* Back button */}
          <button
            onClick={() => navigate('/clinician/screening-data')}
            className="flex items-center gap-1 text-xs font-medium text-gray-500
              hover:text-gray-800 hover:bg-gray-100 transition px-2.5 py-1.5 rounded-lg shrink-0">
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Back
          </button>
          <div className="h-4 w-px bg-gray-200 shrink-0" />

          {/* Patient info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center
              text-white text-sm font-bold shrink-0
              ${patient?.gender === 'F' ? 'bg-pink-400' : 'bg-blue-400'}`}>
              {patient ? patient.first_name[0] : '·'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {patient ? `${patient.first_name} ${patient.last_name}` : 'Loading…'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {patient?.child_code} {patient?.community && `· ${patient.community}`}
                {patient?.child_code && <span className="mx-1.5 text-gray-200">·</span>}
                <span className="text-emerald-600 font-medium">Section {mySection}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Tabs — Dynamic based on section configuration ── */}
        {tabs.length > 0 && (
          <div className="px-4 sm:px-6 border-t border-gray-100">
            <div className="flex">
              {tabs.map(tab => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  end={tab.path === '.'}
                  className={({ isActive }) =>
                    `flex-1 text-center py-2.5 text-xs font-medium transition
                    ${isActive
                      ? 'text-emerald-600 border-b-2 border-emerald-500'
                      : 'text-gray-400 hover:text-gray-600'}`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="p-3 sm:p-6 lg:p-10">
        <div className="bg-white rounded-2xl shadow-sm w-full sm:max-w-lg sm:mx-auto lg:max-w-2xl overflow-hidden">
          <div className="p-4 sm:p-6">
            <Outlet context={contextValue} />
          </div>
        </div>
      </div>

    </div>
  )
}
