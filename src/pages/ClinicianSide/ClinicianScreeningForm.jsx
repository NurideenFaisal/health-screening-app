import { useEffect, useState, useMemo, Suspense, lazy } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ChevronLeft, Loader2, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useClinicianScreeningBootstrap } from '../../hooks/useClinicianScreeningBootstrap'
import { useSectionDefinitions } from '../../hooks/useSectionDefinitions'
import { supabase } from '../../lib/supabase'
import { normalizeSectionOrder } from '../../lib/sectionUtils'

const DynamicRenderer = lazy(() => import('../../components/DynamicRenderer'))

export default function ClinicianScreeningForm() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const initialPatient = location.state?.patient ?? null

  const assignedSections = useMemo(() => {
    if (!profile?.assigned_sections) return []
    return profile.assigned_sections.map(s => Number.parseInt(String(s), 10)).filter(n => !isNaN(n) && n > 0)
  }, [profile?.assigned_sections])

  const [activeSection, setActiveSection] = useState(null)
  const [hasDynamicSchema, setHasDynamicSchema] = useState(false)
  const [schemaLoading, setSchemaLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (assignedSections.length > 0 && !initialized) {
      setActiveSection(assignedSections[0])
      setInitialized(true)
    }
  }, [assignedSections, initialized])

  // Guard: don't run bootstrap hook until activeSection is set
  const shouldBootstrap = !!activeSection

  const { patient, cycle, cycleId, isBootstrapping, bootstrapError, retryBootstrap } = useClinicianScreeningBootstrap({
    childId: id, sectionNumber: shouldBootstrap ? activeSection : null, initialPatient,
  })

  const sectionOrder = normalizeSectionOrder(cycle?.section_order, activeSection)
  const { sectionMap } = useSectionDefinitions(sectionOrder)

  useEffect(() => {
    if (!profile?.clinic_id || !cycleId || !activeSection) { setSchemaLoading(false); return }
    setSchemaLoading(true)
    supabase.rpc('get_clinic_template', { p_clinic_id: profile.clinic_id, p_cycle_id: cycleId, p_section_number: activeSection })
      .then(({ data, error }) => {
        if (error) throw error
        setHasDynamicSchema(data?.fieldSchema?.groups?.length > 0)
      })
      .catch(err => { console.error('Template error:', err); setHasDynamicSchema(false) })
      .finally(() => setSchemaLoading(false))
  }, [activeSection, profile?.clinic_id, cycleId])

  if (!assignedSections.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No Sections Assigned</h3>
          <p className="text-sm text-gray-500 mt-1">Contact your administrator.</p>
          <button onClick={() => navigate('/clinician/screening-data')} className="mt-4 text-sm text-emerald-600 hover:underline">Go Back</button>
        </div>
      </div>
    )
  }

  if (!activeSection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
        <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/clinician/screening-data')} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition px-2.5 py-1.5 rounded-lg shrink-0">
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} /> Back
          </button>
          <div className="h-4 w-px bg-gray-200 shrink-0" />
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${patient?.gender === 'F' ? 'bg-pink-400' : 'bg-blue-400'}`}>
              {patient ? patient.first_name[0] : '·'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{patient ? `${patient.first_name} ${patient.last_name}` : 'Loading...'}</p>
              <p className="text-xs text-gray-400 truncate">{patient?.child_code}{patient?.community && ` · ${patient.community}`}</p>
            </div>
          </div>
        </div>
        {assignedSections.length > 1 && (
          <div className="px-4 sm:px-6 border-t border-gray-100">
            <div className="flex gap-1 overflow-x-auto">
              {assignedSections.map(sn => {
                const section = sectionMap.get(sn)
                return (
                  <button key={sn} onClick={() => setActiveSection(sn)} className={`flex-shrink-0 px-4 py-2.5 text-xs font-medium transition border-b-2 ${sn === activeSection ? 'text-emerald-600 border-emerald-500' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
                    {section?.short_name || section?.name || `Section ${sn}`}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-6 lg:p-10">
        <div className="bg-white rounded-2xl shadow-sm w-full max-w-[1240px] mx-auto overflow-hidden">
          <div className="p-4 sm:p-6">
            {console.log('RENDER - bootstrapError:', !!bootstrapError, 'isBootstrapping:', isBootstrapping, 'schemaLoading:', schemaLoading, 'hasDynamicSchema:', hasDynamicSchema)}
            {bootstrapError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1"><p className="font-semibold text-red-900">Unable to load screening form.</p><p className="mt-1 text-red-700">{bootstrapError.message}</p>
                  <button onClick={retryBootstrap} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm ring-1 ring-red-200 hover:bg-red-100"><RefreshCw className="h-4 w-4" /> Retry</button>
                </div>
              </div>
            ) : isBootstrapping ? (
              <div className="flex min-h-[220px] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-emerald-600" /><span className="ml-2 text-sm text-gray-500">Loading...</span></div>
            ) : schemaLoading ? (
              <div className="flex min-h-[220px] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-emerald-600" /><span className="ml-2 text-sm text-gray-500">Checking template...</span></div>
            ) : hasDynamicSchema ? (
              <Suspense fallback={<div className="flex min-h-[220px] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-emerald-600" /></div>}>
                <DynamicRenderer sectionNumber={activeSection} patientId={id} cycleId={cycleId} clinicId={profile?.clinic_id} />
              </Suspense>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
                <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No Template Activated</h3>
                <p className="text-sm text-gray-500">Contact your administrator to activate a template for this section.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}