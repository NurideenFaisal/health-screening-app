import { useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import ScreeningSection1 from '../../components/ScreeningSection1'
import ScreeningSection2 from '../../components/ScreeningSection2'
import ScreeningSection3 from '../../components/ScreeningSection3'

export default function ClinicianScreeningForm() {
  const { id } = useParams() // patient id from route
  const { profile } = useAuthStore()

  const section = profile?.section   //  from Supabase

  if (!section) {
    return <div>No section assigned to this clinician.</div>
  }

  return (
    <div className="p-6">
      {section === '1' && <ScreeningSection1 patientId={id} />}
      {section === '2' && <ScreeningSection2 patientId={id} />}
      {section === '3' && <ScreeningSection3 patientId={id} />}
    </div>
  )
}
