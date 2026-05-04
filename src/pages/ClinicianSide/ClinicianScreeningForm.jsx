import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ChevronLeft, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useClinicianScreeningBootstrap } from '../../hooks/useClinicianScreeningBootstrap'
import { useSectionDefinitions } from '../../hooks/useSectionDefinitions'
import { supabase } from '../../lib/supabase'
import { normalizeSectionOrder } from '../../lib/sectionUtils'
import { formatPatientName } from '../../lib/textFormat'
import { Button, EmptyState, PageLoader, SectionPill } from '../../components/ui/primitives'

import DynamicRenderer from '../../components/DynamicRenderer'

export default function ClinicianScreeningForm() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const initialPatient = location.state?.patient ?? null
  const assignedSectionsSource = profile?.assigned_sections

  const assignedSections = useMemo(() => {
    if (!assignedSectionsSource) return []
    return assignedSectionsSource.map(section => Number.parseInt(String(section), 10)).filter(section => Number.isInteger(section) && section > 0)
  }, [assignedSectionsSource])

  const [activeSection, setActiveSection] = useState(null)
  const [hasDynamicSchema, setHasDynamicSchema] = useState(false)
  const [schemaLoading, setSchemaLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (assignedSections.length > 0 && !initialized) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveSection(assignedSections[0])
      setInitialized(true)
    }
  }, [assignedSections, initialized])

  const { patient, cycle, cycleId, isBootstrapping, bootstrapError, retryBootstrap } = useClinicianScreeningBootstrap({
    childId: id,
    sectionNumber: activeSection || null,
    initialPatient,
  })

  const sectionOrder = normalizeSectionOrder(cycle?.section_order, activeSection)
  const { sectionMap } = useSectionDefinitions(sectionOrder)

  useEffect(() => {
    if (!profile?.clinic_id || !cycleId || !activeSection) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSchemaLoading(false)
      return
    }

    setSchemaLoading(true)
    supabase.rpc('get_clinic_template', { p_clinic_id: profile.clinic_id, p_cycle_id: cycleId, p_section_number: activeSection })
      .then(({ data, error }) => {
        if (error) throw error
        setHasDynamicSchema(data?.fieldSchema?.groups?.length > 0)
      })
      .catch(error => {
        console.error('Template error:', error)
        setHasDynamicSchema(false)
      })
      .finally(() => setSchemaLoading(false))
  }, [activeSection, profile?.clinic_id, cycleId])

  if (!assignedSections.length) {
    return (
      <div className="min-h-screen bg-slate-100 p-4">
        <EmptyState
          title="No Sections Assigned"
          description="Contact your administrator to assign screening sections."
          action={<Button variant="primary" onClick={() => navigate('/clinician/screening-data')}>Go Back</Button>}
        />
      </div>
    )
  }

  if (!activeSection) {
    return (
      <div className="min-h-screen bg-slate-100">
        <PageLoader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-3 py-3 sm:px-6">
          <Button variant="ghost" className="min-h-11 shrink-0 px-3" onClick={() => navigate('/clinician/screening-data')}>
            <ChevronLeft className="h-4 w-4" strokeWidth={2} /> Back
          </Button>
          <div className="h-6 w-px shrink-0 bg-slate-200" />
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${patient?.gender === 'F' ? 'bg-pink-500' : 'bg-sky-500'}`}>
              {patient ? patient.first_name?.[0] : ''}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold tracking-tight text-slate-900">{patient ? formatPatientName(patient.first_name, patient.last_name) : 'Loading...'}</p>
              <p className="truncate text-xs text-slate-400">{patient?.child_code}{patient?.community && ` · ${patient.community}`}</p>
            </div>
          </div>
        </div>

        {assignedSections.length > 1 && (
          <div className="border-t border-slate-100 px-3 sm:px-6">
            <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto">
              {assignedSections.map(sectionNumber => {
                const section = sectionMap.get(sectionNumber)
                return (
                  <button
                    key={sectionNumber}
                    type="button"
                    onClick={() => setActiveSection(sectionNumber)}
                    className={`min-h-11 shrink-0 border-b-2 px-3 py-2.5 text-xs font-medium transition active:scale-[0.97] ${sectionNumber === activeSection ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  >
                    <SectionPill color={section?.color} label={section?.short_name || section?.name || `S${sectionNumber}`} />
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <main className="mx-auto max-w-[1400px] p-3 sm:p-6 lg:p-8">
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-4 sm:p-5">
            {bootstrapError ? (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-rose-900">Unable to load screening form.</p>
                  <p className="mt-1 text-rose-700">{bootstrapError.message}</p>
                  <Button variant="secondary" onClick={retryBootstrap} className="mt-4"><RefreshCw className="h-4 w-4" /> Retry</Button>
                </div>
              </div>
            ) : (
              <DynamicRenderer sectionNumber={activeSection} patientId={id} cycleId={cycleId} clinicId={profile?.clinic_id} assignedSections={assignedSections} onSectionSwitch={setActiveSection} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
