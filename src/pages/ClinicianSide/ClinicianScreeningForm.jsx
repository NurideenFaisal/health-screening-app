import React from 'react'
import { useParams, useNavigate, NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { ChevronLeft, Hash } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

const SECTION1_TABS = [
  { label: 'Vitals', path: '.' },
  { label: 'Immunization', path: 'immunization' },
  { label: 'Development', path: 'development' },
]

export default function ClinicianScreeningForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const mySection = String(profile?.section || '1')

  const { data: patient } = useQuery({
    queryKey: ['child', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/clinician/screening-data')}
            className="p-1.5 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>

          <div>
            <h2 className="text-base font-bold">
              {patient
                ? `${patient.first_name} ${patient.last_name}`
                : 'Loading...'}
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Hash className="w-3 h-3" />
              {patient?.child_code}
              <span className="text-emerald-600 ml-2">
                Station {mySection}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 1 TABS */}
        {mySection === '1' && (
          <div className="max-w-3xl mx-auto px-4 border-t">
            <div className="flex">
              {SECTION1_TABS.map(tab => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  end={tab.path === '.'}
                  className={({ isActive }) =>
                    `flex-1 text-center py-3 text-xs font-bold ${
                      isActive
                        ? 'text-emerald-600 border-b-2 border-emerald-500'
                        : 'text-gray-400'
                    }`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-sm border min-h-[60vh] p-4">
          <Outlet context={{ patientId: id, patient }} />
        </div>
      </main>
    </div>
  )
}