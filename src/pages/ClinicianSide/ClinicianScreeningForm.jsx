import { useLocation, useNavigate, useParams, NavLink, Outlet } from 'react-router-dom'
import { AlertCircle, ChevronLeft, Loader2, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { getSectionByValue } from '../../config/sections'
import { useClinicianScreeningBootstrap } from '../../hooks/useClinicianScreeningBootstrap'

export default function ClinicianScreeningForm() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const mySection = String(profile?.section || '1')
  const sectionNumber = parseInt(mySection, 10)
  const initialPatient = location.state?.patient ?? null

  const currentSection = getSectionByValue(mySection)
  const tabs = currentSection?.tabs || []

  const {
    patient,
    cycleId,
    isBootstrapping,
    bootstrapError,
    retryBootstrap,
  } = useClinicianScreeningBootstrap({
    childId: id,
    sectionNumber,
    initialPatient,
  })

  const contextValue = {
    patientId: id,
    patient,
    cycleId,
    sectionNumber,
    mySection,
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
        <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/clinician/screening-data')}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition px-2.5 py-1.5 rounded-lg shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Back
          </button>
          <div className="h-4 w-px bg-gray-200 shrink-0" />

          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${patient?.gender === 'F' ? 'bg-pink-400' : 'bg-blue-400'}`}>
              {patient ? patient.first_name[0] : '·'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {patient ? `${patient.first_name} ${patient.last_name}` : 'Loading...'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {patient?.child_code} {patient?.community && `· ${patient.community}`}
                {patient?.child_code && <span className="mx-1.5 text-gray-200">·</span>}
                <span className="text-emerald-600 font-medium">Section {mySection}</span>
              </p>
            </div>
          </div>
        </div>

        {tabs.length > 0 && (
          <div className="px-4 sm:px-6 border-t border-gray-100">
            <div className="flex">
              {tabs.map(tab => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  end={tab.path === '.'}
                  className={({ isActive }) =>
                    `flex-1 text-center py-2.5 text-xs font-medium transition ${isActive
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

      <div className="p-3 sm:p-6 lg:p-10">
        <div className="bg-white rounded-2xl shadow-sm w-full sm:max-w-lg sm:mx-auto lg:max-w-2xl overflow-hidden">
          <div className="p-4 sm:p-6">
            {bootstrapError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-red-900">Unable to load this screening form.</p>
                    <p className="mt-1 text-red-700">
                      {bootstrapError.message || 'A network error interrupted the patient or cycle load.'}
                    </p>
                    <button
                      onClick={retryBootstrap}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm ring-1 ring-red-200 transition hover:bg-red-100"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            ) : isBootstrapping ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  Loading screening form...
                </div>
              </div>
            ) : (
              <Outlet context={contextValue} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
