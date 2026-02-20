import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import ScreeningSection1 from '../../components/ScreeningSection1'
import ScreeningSection2 from '../../components/ScreeningSection2'
import ScreeningSection3 from '../../components/ScreeningSection3'

export default function ClinicianScreeningForm() {
  const { id } = useParams() // This is the child's DB UUID
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const [screening, setScreening] = useState(null)
  const [loading, setLoading] = useState(true)
  const section = profile?.assignedSection

  useEffect(() => { loadScreeningData() }, [id])

  async function loadScreeningData() {
    // 1. Get Active Cycle
    const { data: cycle } = await supabase.from('cycles').select('id').eq('is_active', true).single()
    
    if (!cycle) {
      alert("No active screening cycle found.")
      return navigate('/clinician/screening')
    }

    // 2. Look for existing screening
    let { data: screen } = await supabase.from('screenings')
      .select('*')
      .eq('child_id', id)
      .eq('cycle_id', cycle.id)
      .single()

    // 3. Create if missing (first clinician to touch the patient)
    if (!screen) {
      const { data: newScreen } = await supabase.from('screenings').insert({
        child_id: id,
        cycle_id: cycle.id,
        status: 'draft'
      }).select().single()
      screen = newScreen
    }

    setScreening(screen)
    setLoading(false)
  }

  if (loading) return <div className="p-10 text-center">Loading Patient Data...</div>

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-2xl mx-auto p-4 sm:p-8">
        <button onClick={() => navigate(-1)} className="mb-6 text-xs font-bold text-gray-400 hover:text-emerald-600 transition uppercase tracking-widest">
          ← Back to Queue
        </button>

        <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-10">
          <header className="mb-8">
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Section {section}</p>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              {SECTION_LABELS[section] || 'Clinical Assessment'}
            </h1>
          </header>

          {section === '1' && <ScreeningSection1 screening={screening} onComplete={() => navigate('/clinician/screening')} />}
          {section === '2' && <ScreeningSection2 screening={screening} onComplete={() => navigate('/clinician/screening')} />}
          {section === '3' && <ScreeningSection3 screening={screening} onComplete={() => navigate('/clinician/screening')} />}
        </div>
      </div>
    </div>
  )
}

const SECTION_LABELS = {
  '1': 'Vitals, Immunization & Development',
  '2': 'Laboratory Investigations',
  '3': 'Final Summary & Diagnosis'
}