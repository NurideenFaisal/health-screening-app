import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useScreeningSection } from '../hooks/useScreeningSection'

const RadioGroup = ({ options, value, onChange, name }) => (
  <div className="flex flex-wrap gap-2 mt-1">
    {options.map(opt => (
      <label key={opt} className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${value === opt ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'}`}>
        <input type="radio" name={name} value={opt} checked={value === opt} onChange={() => onChange(opt)} className="sr-only" />
        {opt}
      </label>
    ))}
  </div>
)

const TextInput = ({ value, onChange, placeholder }) => (
  <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Enter value'} className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none" />
)

const FieldLabel = ({ num, label }) => (
  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
    <span className="text-emerald-600 mr-1">{num}.</span>{label}
  </label>
)

const SectionHeader = ({ color, title }) => (
  <h3 className={`font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide`}>
    <span className={`w-2 h-2 rounded-full bg-${color}-500`}></span>{title}
  </h3>
)

const INITIAL = {
  wbc: '', hb: '', mcv: '', mchc: '', plt: '', neu: '', lymp: '',
  bloodGroup: '', rhesusFactor: '',
  sickling: '', hbElectrophoresis: '',
  typhoidO: '', typhoidH: '',
  bf: '', bfCount: '', rdt: '',
  uAppearance: '', uColor: '', uPh: '', uSg: '',
  uProtein: '', uGlucose: '', uNitrite: '', uLeuco: '',
  uBili: '', uBlood: '', uKetone: '', uUrobil: '',
  umPusCells: '', umEpithCells: '', umRBCs: '',
  umYeastCells: '', umSHematobium: '', umTrichomonas: '',
  umCast: '', umCrystals: '',
  stoolMacro: '', stoolMicro: ''
}

export default function HealthScreeningForm() {
  // Get context from ClinicianScreeningForm
  const { patientId, cycleId } = useOutletContext()
  
  // Use the new normalized hook - Section 2 = Lab
  const { 
    sectionData, 
    isComplete, 
    isLoading, 
    save, 
    isSaving 
  } = useScreeningSection({
    childId: patientId,
    cycleId,
    sectionNumber: 2, // Laboratory
  })

  // Initialize form with existing data or defaults
  const [lab, setLab] = useState(() => {
    if (sectionData) {
      return { ...INITIAL, ...sectionData }
    }
    return INITIAL
  })

  // Update form when sectionData loads
  useEffect(() => {
    if (sectionData) {
      setLab({ ...INITIAL, ...sectionData })
    }
  }, [sectionData])

  const set = (key, val) => setLab(prev => ({ ...prev, [key]: val }))

  async function handleSave() {
    try {
      await save({ sectionData: lab, isComplete: false })
      alert('Saved successfully!')
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save: ' + err.message)
    }
  }

  async function handleSaveAndComplete() {
    try {
      await save({ sectionData: lab, isComplete: true })
      alert('Section marked as complete!')
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save: ' + err.message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 py-8 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Laboratory Investigations</h1>
              {isComplete && (
                <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full mt-1">
                  ✓ Complete
                </span>
              )}
            </div>
          </div>
          {/* Progress */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full" style={{ width: '83%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 space-y-6">
          {/* 1. Haematology */}
          <div className="space-y-3">
            <SectionHeader color="emerald" title="Haematology" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'wbc', label: 'WBC (x10³/µL)' },
                { key: 'hb', label: 'Hb (g/dL)' },
                { key: 'mcv', label: 'MCV (fL)' },
                { key: 'mchc', label: 'MCHC (g/dL)' },
                { key: 'plt', label: 'PLT (x10³/µL)' },
                { key: 'neu', label: 'Neutrophils (%)' },
                { key: 'lymp', label: 'Lymphocytes (%)' },
              ].map(f => (
                <div key={f.key}>
                  <FieldLabel num={1} label={f.label} />
                  <TextInput value={lab[f.key]} onChange={v => set(f.key, v)} />
                </div>
              ))}
            </div>
          </div>

          {/* 2. Blood Group */}
          <div className="space-y-3">
            <SectionHeader color="blue" title="Blood Group & Genotype" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel num={8} label="Blood Group" />
                <RadioGroup options={['A', 'B', 'AB', 'O']} value={lab.bloodGroup} onChange={v => set('bloodGroup', v)} name="bloodGroup" />
              </div>
              <div>
                <FieldLabel num={9} label="Rhesus Factor" />
                <RadioGroup options={['Positive', 'Negative']} value={lab.rhesusFactor} onChange={v => set('rhesusFactor', v)} name="rhesusFactor" />
              </div>
              <div>
                <FieldLabel num={10} label="Sickling Test" />
                <RadioGroup options={['Negative', 'Positive']} value={lab.sickling} onChange={v => set('sickling', v)} name="sickling" />
              </div>
              <div>
                <FieldLabel num={11} label="Hb Electrophoresis" />
                <TextInput value={lab.hbElectrophoresis} onChange={v => set('hbElectrophoresis', v)} placeholder="e.g. AA, AS, SS" />
              </div>
            </div>
          </div>

          {/* 3. Widal & Serology */}
          <div className="space-y-3">
            <SectionHeader color="amber" title="Widal & Serology" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <FieldLabel num={12} label="Typhoid O" />
                <TextInput value={lab.typhoidO} onChange={v => set('typhoidO', v)} />
              </div>
              <div>
                <FieldLabel num={13} label="Typhoid H" />
                <TextInput value={lab.typhoidH} onChange={v => set('typhoidH', v)} />
              </div>
              <div>
                <FieldLabel num={14} label="BF (Malaria)" />
                <RadioGroup options={['Negative', 'Positive']} value={lab.bf} onChange={v => set('bf', v)} name="bf" />
              </div>
              <div>
                <FieldLabel num={15} label="BF Count" />
                <TextInput value={lab.bfCount} onChange={v => set('bfCount', v)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel num={16} label="RDT (Malaria)" />
                <RadioGroup options={['Negative', 'Positive']} value={lab.rdt} onChange={v => set('rdt', v)} name="rdt" />
              </div>
            </div>
          </div>

          {/* 4. Urinalysis - Physical & Chemical */}
          <div className="space-y-3">
            <SectionHeader color="purple" title="Urinalysis - Physical & Chemical" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <FieldLabel num={17} label="Appearance" />
                <TextInput value={lab.uAppearance} onChange={v => set('uAppearance', v)} />
              </div>
              <div>
                <FieldLabel num={18} label="Color" />
                <TextInput value={lab.uColor} onChange={v => set('uColor', v)} />
              </div>
              <div>
                <FieldLabel num={19} label="pH" />
                <TextInput value={lab.uPh} onChange={v => set('uPh', v)} />
              </div>
              <div>
                <FieldLabel num={20} label="Specific Gravity" />
                <TextInput value={lab.uSg} onChange={v => set('uSg', v)} />
              </div>
              <div>
                <FieldLabel num={21} label="Protein" />
                <RadioGroup options={['Negative', '+', '++', '+++']} value={lab.uProtein} onChange={v => set('uProtein', v)} name="uProtein" />
              </div>
              <div>
                <FieldLabel num={22} label="Glucose" />
                <RadioGroup options={['Negative', '+', '++', '+++']} value={lab.uGlucose} onChange={v => set('uGlucose', v)} name="uGlucose" />
              </div>
              <div>
                <FieldLabel num={23} label="Nitrite" />
                <RadioGroup options={['Negative', 'Positive']} value={lab.uNitrite} onChange={v => set('uNitrite', v)} name="uNitrite" />
              </div>
              <div>
                <FieldLabel num={24} label="Leucocytes" />
                <RadioGroup options={['Negative', '+', '++', '+++']} value={lab.uLeuco} onChange={v => set('uLeuco', v)} name="uLeuco" />
              </div>
              <div>
                <FieldLabel num={25} label="Bilirubin" />
                <RadioGroup options={['Negative', '+', '++', '+++']} value={lab.uBili} onChange={v => set('uBili', v)} name="uBili" />
              </div>
              <div>
                <FieldLabel num={26} label="Blood" />
                <RadioGroup options={['Negative', '+', '++', '+++']} value={lab.uBlood} onChange={v => set('uBlood', v)} name="uBlood" />
              </div>
              <div>
                <FieldLabel num={27} label="Ketones" />
                <RadioGroup options={['Negative', '+', '++', '+++']} value={lab.uKetone} onChange={v => set('uKetone', v)} name="uKetone" />
              </div>
              <div>
                <FieldLabel num={28} label="Urobilinogen" />
                <TextInput value={lab.uUrobil} onChange={v => set('uUrobil', v)} />
              </div>
            </div>
          </div>

          {/* 5. Urinalysis - Microscopic */}
          <div className="space-y-3">
            <SectionHeader color="pink" title="Urinalysis - Microscopic" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'umPusCells', label: 'Pus Cells' },
                { key: 'umEpithCells', label: 'Epithelial Cells' },
                { key: 'umRBCs', label: 'RBCs' },
                { key: 'umYeastCells', label: 'Yeast Cells' },
                { key: 'umSHematobium', label: 'S. Haematobium' },
                { key: 'umTrichomonas', label: 'Trichomonas' },
                { key: 'umCast', label: 'Cast' },
                { key: 'umCrystals', label: 'Crystals' },
              ].map(f => (
                <div key={f.key}>
                  <FieldLabel num={29} label={f.label} />
                  <TextInput value={lab[f.key]} onChange={v => set(f.key, v)} />
                </div>
              ))}
            </div>
          </div>

          {/* 6. Stool */}
          <div className="space-y-3">
            <SectionHeader color="teal" title="Stool Analysis" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel num={41} label="Stool Macroscopy" />
                <TextInput value={lab.stoolMacro} onChange={v => set('stoolMacro', v)} placeholder="Macroscopic findings" />
              </div>
              <div>
                <FieldLabel num={42} label="Stool Microscopy" />
                <TextInput value={lab.stoolMicro} onChange={v => set('stoolMicro', v)} placeholder="Microscopic findings" />
              </div>
            </div>
          </div>

          {/* Save Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save (Draft)'}
            </button>
            <button 
              type="button" 
              onClick={handleSaveAndComplete}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save & Complete'}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          © 2024 Health Screening • Confidential Health Information
        </p>
      </div>
    </div>
  )
}
