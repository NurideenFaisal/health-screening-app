import { useState } from 'react'

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

export default function HealthScreeningForm() {
  const [currentSection, setCurrentSection] = useState(5)
  const [completedSections, setCompletedSections] = useState({ 1: false, 2: false, 3: false, 4: false, 5: false, 6: false })

  const [lab, setLab] = useState({
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
  })

  const set = (key, val) => setLab(prev => ({ ...prev, [key]: val }))

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
              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Section 5 of 6</p>
              <h1 className="text-2xl font-bold text-gray-900">Laboratory Investigations</h1>
              <p className="text-sm text-gray-500">Benkrom Pentecost Child & Youth Development Centre</p>
            </div>
          </div>
          {/* Progress */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full" style={{ width: '83%' }}></div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8 space-y-8">

          {/* ── Full Blood Count ── */}
          <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
            <SectionHeader color="red" title="Full Blood Count" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { num: 7, key: 'wbc', label: 'White Blood Cells (WBC)' },
                { num: 8, key: 'hb', label: 'Hemoglobin (HB)' },
                { num: 9, key: 'mcv', label: 'MCV' },
                { num: 10, key: 'mchc', label: 'MCHC' },
                { num: 11, key: 'plt', label: 'PLT' },
                { num: 12, key: 'neu', label: 'NEU' },
                { num: 13, key: 'lymp', label: 'LYMP' },
              ].map(f => (
                <div key={f.key}>
                  <FieldLabel num={f.num} label={f.label} />
                  <TextInput value={lab[f.key]} onChange={v => set(f.key, v)} placeholder="Result" />
                </div>
              ))}
            </div>
          </div>

          {/* ── Blood Grouping ── */}
          <div className="bg-pink-50 rounded-2xl p-5 border border-pink-100">
            <SectionHeader color="pink" title="Blood Grouping" />
            <div className="space-y-4">
              <div>
                <FieldLabel num={14} label="Blood Group" />
                <RadioGroup name="bloodGroup" options={['A', 'B', 'AB', 'O']} value={lab.bloodGroup} onChange={v => set('bloodGroup', v)} />
              </div>
              <div>
                <FieldLabel num={15} label="Rhesus Factor" />
                <RadioGroup name="rhesusFactor" options={['Positive', 'Negative']} value={lab.rhesusFactor} onChange={v => set('rhesusFactor', v)} />
              </div>
            </div>
          </div>

          {/* ── Sickling Test ── */}
          <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
            <SectionHeader color="orange" title="Sickling Test" />
            <div className="space-y-4">
              <div>
                <FieldLabel num={16} label="Sickling" />
                <RadioGroup name="sickling" options={['Positive', 'Negative']} value={lab.sickling} onChange={v => set('sickling', v)} />
              </div>
              <div>
                <FieldLabel num={17} label="HB Electrophoresis" />
                <RadioGroup name="hbElectrophoresis" options={['AA', 'AS', 'SS', 'AC', 'SC']} value={lab.hbElectrophoresis} onChange={v => set('hbElectrophoresis', v)} />
              </div>
            </div>
          </div>

          {/* ── Typhoid Test ── */}
          <div className="bg-yellow-50 rounded-2xl p-5 border border-yellow-100">
            <SectionHeader color="yellow" title="Typhoid Test (Widal)" />
            <div className="space-y-4">
              <div>
                <FieldLabel num={18} label="Salmonella Typhi O" />
                <RadioGroup name="typhoidO" options={['1:20', '1:40', '1:80', '1:120', '1:160', '1:320']} value={lab.typhoidO} onChange={v => set('typhoidO', v)} />
              </div>
              <div>
                <FieldLabel num={18} label="Salmonella Typhi H" />
                <RadioGroup name="typhoidH" options={['Negative', '1:20', '1:40', '1:80', '1:120', '1:160', '1:320']} value={lab.typhoidH} onChange={v => set('typhoidH', v)} />
              </div>
            </div>
          </div>

          {/* ── Malaria Test ── */}
          <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
            <SectionHeader color="green" title="Malaria Test" />
            <div className="space-y-4">
              <div>
                <FieldLabel num={19} label="BF (Blood Film)" />
                <RadioGroup name="bf" options={['Not Seen', 'Seen PF', 'Seen P ovale', 'Seen P malariae']} value={lab.bf} onChange={v => set('bf', v)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel num={21} label="Count" />
                  <TextInput value={lab.bfCount} onChange={v => set('bfCount', v)} placeholder="Enter count" />
                </div>
                <div>
                  <FieldLabel num={20} label="RDT" />
                  <RadioGroup name="rdt" options={['Positive', 'Negative']} value={lab.rdt} onChange={v => set('rdt', v)} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Urinalysis ── */}
          <div className="bg-yellow-50 rounded-2xl p-5 border border-yellow-100">
            <SectionHeader color="yellow" title="Urinalysis" />
            <div className="space-y-4">
              <div>
                <FieldLabel num={22} label="Appearance" />
                <RadioGroup name="uAppearance" options={['Clear', 'Cloudy', 'Bloody', 'Hazy']} value={lab.uAppearance} onChange={v => set('uAppearance', v)} />
              </div>
              <div>
                <FieldLabel num={23} label="Color" />
                <RadioGroup name="uColor" options={['Straw', 'Amber']} value={lab.uColor} onChange={v => set('uColor', v)} />
              </div>
              <div>
                <FieldLabel num={24} label="pH" />
                <RadioGroup name="uPh" options={['5.0','5.5','6.0','6.5','7.0','7.5','8.0','8.5','9.0']} value={lab.uPh} onChange={v => set('uPh', v)} />
              </div>
              <div>
                <FieldLabel num={25} label="SG" />
                <RadioGroup name="uSg" options={['1.000','1.005','1.010','1.015','1.020','1.025','1.030']} value={lab.uSg} onChange={v => set('uSg', v)} />
              </div>
              {[
                { num: 26, key: 'uProtein', label: 'Protein' },
                { num: 27, key: 'uGlucose', label: 'Glucose' },
                { num: 28, key: 'uNitrite', label: 'Nitrite' },
                { num: 29, key: 'uLeuco', label: 'Leucocytes' },
                { num: 30, key: 'uBili', label: 'Bilirubin' },
                { num: 31, key: 'uBlood', label: 'Blood' },
                { num: 32, key: 'uKetone', label: 'Ketone' },
              ].map(f => (
                <div key={f.key}>
                  <FieldLabel num={f.num} label={f.label} />
                  <RadioGroup name={f.key} options={['Pos+1','Pos+2','Pos+3','Negative']} value={lab[f.key]} onChange={v => set(f.key, v)} />
                </div>
              ))}
              <div>
                <FieldLabel num={33} label="Urobilinogen" />
                <RadioGroup name="uUrobil" options={['Normal', 'Increasing']} value={lab.uUrobil} onChange={v => set('uUrobil', v)} />
              </div>
            </div>
          </div>

          {/* ── Urine Microscopy ── */}
          <div className="bg-cyan-50 rounded-2xl p-5 border border-cyan-100">
            <SectionHeader color="cyan" title="Urine Microscopy" />
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { num: 34, key: 'umPusCells', label: 'Pus Cells' },
                  { num: 35, key: 'umEpithCells', label: 'Epith Cells' },
                  { num: 36, key: 'umRBCs', label: 'RBCs' },
                ].map(f => (
                  <div key={f.key}>
                    <FieldLabel num={f.num} label={f.label} />
                    <TextInput value={lab[f.key]} onChange={v => set(f.key, v)} placeholder="Result" />
                  </div>
                ))}
              </div>
              {[
                { num: '36', key: 'umYeastCells', label: 'Yeast Cells' },
                { num: 37, key: 'umSHematobium', label: 'S. Hematobium' },
                { num: 38, key: 'umTrichomonas', label: 'Trichomonas Vaginalis' },
              ].map(f => (
                <div key={f.key}>
                  <FieldLabel num={f.num} label={f.label} />
                  <RadioGroup name={f.key} options={['Seen +1','Seen +2','Seen +3','Not Seen']} value={lab[f.key]} onChange={v => set(f.key, v)} />
                </div>
              ))}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { num: 39, key: 'umCast', label: 'Cast' },
                  { num: 40, key: 'umCrystals', label: 'Crystals' },
                ].map(f => (
                  <div key={f.key}>
                    <FieldLabel num={f.num} label={f.label} />
                    <TextInput value={lab[f.key]} onChange={v => set(f.key, v)} placeholder="Result" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Stool Examination ── */}
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
            <SectionHeader color="amber" title="Stool Examination" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel num={41} label="Stool Macroscopy" />
                <TextInput value={lab.stoolMacro} onChange={v => set('stoolMacro', v)} placeholder="Gross appearance" />
              </div>
              <div>
                <FieldLabel num={42} label="Stool Microscopy" />
                <TextInput value={lab.stoolMicro} onChange={v => set('stoolMicro', v)} placeholder="Microscopic findings" />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="button" className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl transition-all">
              ← Previous
            </button>
            <button type="button" className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg">
              Next →
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          © 2024 Benkrom Pentecost Child & Youth Development Centre • Confidential Health Information
        </p>
      </div>
    </div>
  )
}