import { useState } from 'react'

const RadioGroup = ({ options, value, onChange, name }) => (
  <div className="flex flex-wrap gap-2 mt-1">
    {options.map(opt => (
      <button
        key={opt}
        type="button"
        onClick={() => onChange(opt)}
        className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
          value === opt
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
)

const TextInput = ({ value, onChange, placeholder }) => (
  <input
    type="text"
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder || 'Enter value'}
    className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
  />
)

const FieldLabel = ({ num, label }) => (
  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
    <span className="text-emerald-600 mr-1">{num}.</span>{label}
  </label>
)

const SectionHeader = ({ color, title }) => {
  const colorMap = {
    red: 'bg-red-500', pink: 'bg-pink-500', orange: 'bg-orange-500',
    yellow: 'bg-yellow-500', green: 'bg-green-500', cyan: 'bg-cyan-500',
    amber: 'bg-amber-500', emerald: 'bg-emerald-500', teal: 'bg-teal-500',
  }
  return (
    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${colorMap[color] || 'bg-gray-500'}`}></span>
      {title}
    </h3>
  )
}

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

export default function LabInvestigations() {
  const [lab, setLab] = useState(INITIAL)
  const set = (key, val) => setLab(prev => ({ ...prev, [key]: val }))

  return (
    <div className="space-y-6 p-4 max-w-3xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Laboratory Investigations</h2>
          <p className="text-sm text-gray-600">Blood, urine, and stool examination results</p>
        </div>
      </div>

      {/* ── Full Blood Count ── */}
      <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
        <SectionHeader color="red" title="Full Blood Count" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { num: 7,  key: 'wbc',  label: 'White Blood Cells (WBC)' },
            { num: 8,  key: 'hb',   label: 'Hemoglobin (HB)' },
            { num: 9,  key: 'mcv',  label: 'MCV' },
            { num: 10, key: 'mchc', label: 'MCHC' },
            { num: 11, key: 'plt',  label: 'PLT' },
            { num: 12, key: 'neu',  label: 'NEU' },
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
            <FieldLabel num={19} label="Salmonella Typhi H" />
            <RadioGroup name="typhoidH" options={['Negative', '1:20', '1:40', '1:80', '1:120', '1:160', '1:320']} value={lab.typhoidH} onChange={v => set('typhoidH', v)} />
          </div>
        </div>
      </div>

      {/* ── Malaria Test ── */}
      <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
        <SectionHeader color="green" title="Malaria Test" />
        <div className="space-y-4">
          <div>
            <FieldLabel num={20} label="BF (Blood Film)" />
            <RadioGroup name="bf" options={['Not Seen', 'Seen PF', 'Seen P ovale', 'Seen P malariae']} value={lab.bf} onChange={v => set('bf', v)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel num={21} label="Count" />
              <TextInput value={lab.bfCount} onChange={v => set('bfCount', v)} placeholder="Enter count" />
            </div>
            <div>
              <FieldLabel num={22} label="RDT" />
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
            <FieldLabel num={23} label="Appearance" />
            <RadioGroup name="uAppearance" options={['Clear', 'Cloudy', 'Bloody', 'Hazy']} value={lab.uAppearance} onChange={v => set('uAppearance', v)} />
          </div>
          <div>
            <FieldLabel num={24} label="Color" />
            <RadioGroup name="uColor" options={['Straw', 'Amber']} value={lab.uColor} onChange={v => set('uColor', v)} />
          </div>
          <div>
            <FieldLabel num={25} label="pH" />
            <RadioGroup name="uPh" options={['5.0','5.5','6.0','6.5','7.0','7.5','8.0','8.5','9.0']} value={lab.uPh} onChange={v => set('uPh', v)} />
          </div>
          <div>
            <FieldLabel num={26} label="SG" />
            <RadioGroup name="uSg" options={['1.000','1.005','1.010','1.015','1.020','1.025','1.030']} value={lab.uSg} onChange={v => set('uSg', v)} />
          </div>
          {[
            { num: 27, key: 'uProtein', label: 'Protein' },
            { num: 28, key: 'uGlucose', label: 'Glucose' },
            { num: 29, key: 'uNitrite', label: 'Nitrite' },
            { num: 30, key: 'uLeuco',   label: 'Leucocytes' },
            { num: 31, key: 'uBili',    label: 'Bilirubin' },
            { num: 32, key: 'uBlood',   label: 'Blood' },
            { num: 33, key: 'uKetone',  label: 'Ketone' },
          ].map(f => (
            <div key={f.key}>
              <FieldLabel num={f.num} label={f.label} />
              <RadioGroup name={f.key} options={['Pos+1','Pos+2','Pos+3','Negative']} value={lab[f.key]} onChange={v => set(f.key, v)} />
            </div>
          ))}
          <div>
            <FieldLabel num={34} label="Urobilinogen" />
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
              { num: 35, key: 'umPusCells',   label: 'Pus Cells' },
              { num: 36, key: 'umEpithCells', label: 'Epith Cells' },
              { num: 37, key: 'umRBCs',        label: 'RBCs' },
            ].map(f => (
              <div key={f.key}>
                <FieldLabel num={f.num} label={f.label} />
                <TextInput value={lab[f.key]} onChange={v => set(f.key, v)} placeholder="Result" />
              </div>
            ))}
          </div>
          {[
            { num: 38, key: 'umYeastCells',  label: 'Yeast Cells' },
            { num: 39, key: 'umSHematobium', label: 'S. Hematobium' },
            { num: 40, key: 'umTrichomonas', label: 'Trichomonas Vaginalis' },
          ].map(f => (
            <div key={f.key}>
              <FieldLabel num={f.num} label={f.label} />
              <RadioGroup name={f.key} options={['Seen +1','Seen +2','Seen +3','Not Seen']} value={lab[f.key]} onChange={v => set(f.key, v)} />
            </div>
          ))}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { num: 41, key: 'umCast',     label: 'Cast' },
              { num: 42, key: 'umCrystals', label: 'Crystals' },
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
            <FieldLabel num={43} label="Stool Macroscopy" />
            <TextInput value={lab.stoolMacro} onChange={v => set('stoolMacro', v)} placeholder="Gross appearance" />
          </div>
          <div>
            <FieldLabel num={44} label="Stool Microscopy" />
            <TextInput value={lab.stoolMicro} onChange={v => set('stoolMicro', v)} placeholder="Microscopic findings" />
          </div>
        </div>
      </div>

      {/* ── Buttons ── */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => alert('Save Draft clicked')}
          className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={() => alert('Save & Complete clicked — payload: ' + JSON.stringify(lab, null, 2))}
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Save & Complete →
        </button>
      </div>

    </div>
  )
}