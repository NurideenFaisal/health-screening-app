import { useState, useEffect } from 'react'

const NORMAL = 'Normal'

function CheckGroup({ options, values, onChange, extra, extraVal, onExtra, columns = 2 }) {
  const toggle = (opt) => {
    const arr = values ? values.split(', ').filter(Boolean) : []
    const next = arr.includes(opt) ? arr.filter(a => a !== opt) : [...arr, opt]
    onChange(next.join(', '))
  }
  const isChecked = (opt) => (values || '').split(', ').includes(opt)
  const cols = columns === 3 ? 'grid-cols-3' : columns === 1 ? 'grid-cols-1' : 'grid-cols-2'
  return (
    <div>
      <div className={`grid ${cols} gap-2 mt-1`}>
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer group">
            <div onClick={() => toggle(opt)} className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${isChecked(opt) ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300 bg-white hover:border-emerald-400'}`}>
              {isChecked(opt) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
            </div>
            <span onClick={() => toggle(opt)} className="text-sm text-gray-700 group-hover:text-emerald-700 cursor-pointer select-none">{opt}</span>
          </label>
        ))}
      </div>
      {extra && (
        <input type="text" value={extraVal || ''} onChange={e => onExtra(e.target.value)}
          className="mt-3 w-full px-3 py-2 bg-white border border-dashed border-gray-300 rounded-lg text-sm text-gray-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
          placeholder="Other (specify)…"/>
      )}
    </div>
  )
}

function SubCard({ title, color = 'emerald', children }) {
  const bg = { emerald:'bg-emerald-50 border-emerald-100', blue:'bg-blue-50 border-blue-100', purple:'bg-purple-50 border-purple-100', pink:'bg-pink-50 border-pink-100', indigo:'bg-indigo-50 border-indigo-100', teal:'bg-teal-50 border-teal-100' }
  const dot = { emerald:'bg-emerald-500', blue:'bg-blue-500', purple:'bg-purple-500', pink:'bg-pink-500', indigo:'bg-indigo-500', teal:'bg-teal-500' }
  return (
    <div className={`rounded-2xl p-5 border ${bg[color] || bg.emerald}`}>
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${dot[color] || dot.emerald}`}></span>
        {title}
      </h3>
      {children}
    </div>
  )
}

function FieldLabel({ label, badge }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      {badge && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{badge}</span>}
    </div>
  )
}

function SelectButtons({ options, value, onChange, multi = false }) {
  const toggle = (opt) => {
    if (!multi) return onChange(value === opt ? '' : opt)
    const arr = value ? value.split(', ') : []
    onChange((arr.includes(opt) ? arr.filter(a => a !== opt) : [...arr, opt]).join(', '))
  }
  const isSelected = (opt) => multi ? (value || '').split(', ').includes(opt) : value === opt
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => toggle(opt)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isSelected(opt) ? 'bg-emerald-600 text-white border-emerald-600 shadow' : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'}`}>
          {opt}
        </button>
      ))}
    </div>
  )
}

function OphFieldRow({ label, options, value, onChange, multi = false }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0 px-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <span className="text-sm font-semibold text-gray-700 min-w-[140px] pt-1">{label}</span>
        <SelectButtons options={options} value={value} onChange={onChange} multi={multi}/>
      </div>
    </div>
  )
}

const devFields = [
  {key:'grossMotor', label:'Gross Motor'},
  {key:'fineMotor',  label:'Fine Motor'},
  {key:'language',   label:'Language'},
  {key:'personalSocial', label:'Personal / Social'}
]

export default function DevSpecialistAssessment() {
  const [data, setData] = useState({
    developmental: { grossMotor:'', fineMotor:'', language:'', personalSocial:'' },
    ophthalmic: { rightVision:'', leftVision:'', nose:'', anteriorSegment:'', posteriorSegment:'', conjunctiva:'', diagnosis:'', strangeDiagnosis:'', recommendations:'' },
    dental: { mouth:'', mouthExtra:'', teeth:'', teethExtra:'', diagnosis:'', diagnosisExtra:'', treatment:'', treatmentExtra:'' },
    ent: { ears:'', earsExtra:'', nose:'', throat:'', treatment:'', treatmentExtra:'' },
    combinedDiagnosis:'', combinedDiagnosisExtra:'',
    referral: { referred:'' }
  })

  const upd = (f, v) => setData(p => ({...p, [f]: v}))
  const updN = (parent, f, v) => setData(p => ({...p, [parent]: {...p[parent], [f]: v}}))

  // Auto-fill ophthalmic diagnosis
  useEffect(() => {
    const o = data.ophthalmic
    const parts = []
    if (o.rightVision)     parts.push(`Right Vision: ${o.rightVision}`)
    if (o.leftVision)      parts.push(`Left Vision: ${o.leftVision}`)
    if (o.nose)            parts.push(`Nose: ${o.nose}`)
    if (o.anteriorSegment) parts.push(`Anterior: ${o.anteriorSegment}`)
    if (o.posteriorSegment)parts.push(`Posterior: ${o.posteriorSegment}`)
    if (o.conjunctiva)     parts.push(`Conjunctiva: ${o.conjunctiva}`)
    updN('ophthalmic', 'diagnosis', parts.join(' | '))
  }, [data.ophthalmic.rightVision, data.ophthalmic.leftVision, data.ophthalmic.nose, data.ophthalmic.anteriorSegment, data.ophthalmic.posteriorSegment, data.ophthalmic.conjunctiva])

  // Auto-fill dental diagnosis from mouth + teeth + extra
  useEffect(() => {
    const mouth = (data.dental.mouth || '').split(', ').filter(Boolean)
    const teeth = (data.dental.teeth || '').split(', ').filter(Boolean)
    const combined = [...new Set([...mouth, ...teeth])]
    if (data.dental.diagnosisExtra) combined.push(data.dental.diagnosisExtra)
    updN('dental', 'diagnosis', combined.join(', '))
  }, [data.dental.mouth, data.dental.teeth, data.dental.diagnosisExtra])

  // Auto-fill combined specialist diagnosis
  useEffect(() => {
    const parts = []
    const oph = data.ophthalmic
    if (oph.diagnosis)       parts.push(`👁 Eye — ${oph.diagnosis}`)
    if (oph.strangeDiagnosis)parts.push(`👁 Eye (other) — ${oph.strangeDiagnosis}`)
    const dentalDx = (data.dental.diagnosis || '').split(', ').filter(Boolean)
    if (dentalDx.length)     parts.push(`🦷 Dental — ${dentalDx.join(', ')}`)
    const entParts = []
    const ears   = (data.ent.ears   || '').split(', ').filter(Boolean)
    const nose   = (data.ent.nose   || '').split(', ').filter(Boolean)
    const throat = (data.ent.throat || '').split(', ').filter(Boolean)
    if (ears.length)   entParts.push(`Ears: ${ears.join(', ')}`)
    if (nose.length)   entParts.push(`Nose: ${nose.join(', ')}`)
    if (throat.length) entParts.push(`Throat: ${throat.join(', ')}`)
    if (entParts.length) parts.push(`👂 ENT — ${entParts.join(' | ')}`)
    if (data.combinedDiagnosisExtra) parts.push(`📝 Notes — ${data.combinedDiagnosisExtra}`)
    upd('combinedDiagnosis', parts.join('\n'))
  }, [data.ophthalmic.diagnosis, data.ophthalmic.strangeDiagnosis, data.dental.diagnosis, data.ent.ears, data.ent.nose, data.ent.throat, data.combinedDiagnosisExtra])

  const allDevNormal = devFields.every(f => data.developmental[f.key] === NORMAL)
  const tickAllDevNormal = () => {
    const u = {}; devFields.forEach(f => { u[f.key] = NORMAL })
    setData(p => ({...p, developmental: {...p.developmental, ...u}}))
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
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Developmental & Specialized Assessments</h1>
              <p className="text-sm text-gray-500 mt-0.5">Benkrom Pentecost Child & Youth Development Centre</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">

          {/* ── 1. Developmental Milestones ── */}
          <SubCard title="Developmental Milestones" color="emerald">
            <p className="text-xs text-gray-500 -mt-2 mb-4">For children under 5 years</p>
            <div className="flex justify-end mb-3">
              <button type="button" onClick={tickAllDevNormal}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${allDevNormal ? 'bg-emerald-600 text-white border-emerald-600 shadow' : 'bg-white text-emerald-700 border-emerald-400 hover:bg-emerald-50'}`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${allDevNormal ? 'bg-white border-white' : 'border-emerald-500'}`}>
                  {allDevNormal && <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                Tick Normal for All
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 divide-y overflow-hidden">
              {devFields.map(({key, label}) => (
                <div key={key} className="px-4 py-3 flex items-center justify-between flex-wrap gap-3">
                  <span className="text-sm font-semibold text-gray-700 w-40">{label}</span>
                  <div className="flex gap-2">
                    {[NORMAL, 'Delayed'].map(opt => (
                      <button key={opt} type="button"
                        onClick={() => updN('developmental', key, data.developmental[key] === opt ? '' : opt)}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                          data.developmental[key] === opt
                            ? opt === NORMAL ? 'bg-emerald-600 text-white border-emerald-600 shadow' : 'bg-amber-500 text-white border-amber-500 shadow'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
                        }`}>{opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SubCard>

          {/* ── 2. Ophthalmic Assessment ── */}
          <SubCard title="Ophthalmic Assessment" color="blue">
            <p className="text-xs text-gray-500 -mt-2 mb-4">Diagnosis auto-fills from selections below</p>
            <div className="bg-white rounded-xl border border-gray-200 divide-y overflow-hidden mb-4">
              <OphFieldRow label="Right Vision"      options={['6/6','6/9','6/12','6/18']} value={data.ophthalmic.rightVision} onChange={v=>updN('ophthalmic','rightVision',v)}/>
              <OphFieldRow label="Left Vision"       options={['6/6','6/9','6/12','6/18']} value={data.ophthalmic.leftVision}  onChange={v=>updN('ophthalmic','leftVision',v)}/>
              <OphFieldRow label="Nose"              options={['Normal','Rhinitis','Foreign body in the nose']} value={data.ophthalmic.nose} onChange={v=>updN('ophthalmic','nose',v)}/>
              <OphFieldRow label="Anterior Segment"  options={['Normal','Trauma to the eye','Cataract','Refractive error','Hyphema']} value={data.ophthalmic.anteriorSegment} onChange={v=>updN('ophthalmic','anteriorSegment',v)}/>
              <OphFieldRow label="Posterior Segment" options={['Normal','Abnormal','Night blindness','Suspicious Disc','Pigment']} value={data.ophthalmic.posteriorSegment} onChange={v=>updN('ophthalmic','posteriorSegment',v)}/>
              <OphFieldRow label="Conjunctiva"       options={['Allergic Conjunctivitis','Vernal Conjunctivitis']} value={data.ophthalmic.conjunctiva} onChange={v=>updN('ophthalmic','conjunctiva',v)} multi={true}/>
            </div>
            <div className="space-y-3">
              <div>
                <FieldLabel label="Diagnosis" badge="Auto-filled"/>
                <div className="px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-sm text-gray-800 font-medium min-h-[44px]">
                  {data.ophthalmic.diagnosis || <span className="text-gray-400 font-normal">Populates as you make selections above…</span>}
                </div>
              </div>
              <div>
                <FieldLabel label="Strange / Additional Diagnosis"/>
                <input type="text" value={data.ophthalmic.strangeDiagnosis} onChange={e=>updN('ophthalmic','strangeDiagnosis',e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="Any unusual or unlisted findings…"/>
              </div>
              <div>
                <FieldLabel label="Recommendations / Treatment"/>
                <textarea value={data.ophthalmic.recommendations} onChange={e=>updN('ophthalmic','recommendations',e.target.value)} rows="2"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="Treatment plan…"/>
              </div>
            </div>
          </SubCard>

          {/* ── 3. Dental Assessment ── */}
          <SubCard title="Dental Assessment" color="purple">
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <FieldLabel label="Mouth"/>
                <CheckGroup options={['Normal','Gingivitis','Aphthous ulcers','Oral Thrush']} values={data.dental.mouth} onChange={v=>updN('dental','mouth',v)} extra extraVal={data.dental.mouthExtra} onExtra={v=>updN('dental','mouthExtra',v)}/>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <FieldLabel label="Teeth"/>
                <CheckGroup options={['Fluorosis','Dental calculus','Dental caries','Mixed dentition','Retained roots']} values={data.dental.teeth} onChange={v=>updN('dental','teeth',v)} extra extraVal={data.dental.teethExtra} onExtra={v=>updN('dental','teethExtra',v)}/>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <FieldLabel label="Diagnosis" badge="Auto-filled from Mouth & Teeth"/>
                <div className="mt-1 px-4 py-3 bg-purple-50 border-2 border-purple-200 rounded-xl text-sm text-gray-800 font-medium min-h-[44px]">
                  {data.dental.diagnosis || <span className="text-gray-400 font-normal">Populates as you select Mouth and Teeth findings above…</span>}
                </div>
                <input type="text" value={data.dental.diagnosisExtra} onChange={e=>updN('dental','diagnosisExtra',e.target.value)}
                  className="mt-2 w-full px-3 py-2 bg-white border border-dashed border-gray-300 rounded-lg text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  placeholder="Additional diagnosis (specify)…"/>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <FieldLabel label="Treatment / Recommendations"/>
                <CheckGroup options={['Ibuprofen','Paracetamol','Metronidazole','Amoxicillin']} values={data.dental.treatment} onChange={v=>updN('dental','treatment',v)} extra extraVal={data.dental.treatmentExtra} onExtra={v=>updN('dental','treatmentExtra',v)}/>
              </div>
            </div>
          </SubCard>

          {/* ── 4. ENT Assessment ── */}
          <SubCard title="Ears, Nose & Throat (ENT) Assessment" color="pink">
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <FieldLabel label="Ears"/>
                <CheckGroup options={['Normal ears','Foreign body','Impacted cerumen','Impacted cerumen left','Impacted cerumen right','Impacted cerumen bilateral','Perforated eardrum']} values={data.ent.ears} onChange={v=>updN('ent','ears',v)} extra extraVal={data.ent.earsExtra} onExtra={v=>updN('ent','earsExtra',v)}/>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <FieldLabel label="Nose"/>
                <CheckGroup options={['Normal','Enlarged Turbinates','Sinusitis','Nasal Polyps','Rhinitis']} values={data.ent.nose} onChange={v=>updN('ent','nose',v)}/>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <FieldLabel label="Throat"/>
                <CheckGroup options={['Normal','Tonsillar hypertrophy','Tonsillitis','Acute Pharyngitis']} values={data.ent.throat} onChange={v=>updN('ent','throat',v)}/>
              </div>
            </div>
          </SubCard>

          {/* ── 5. Combined Specialist Diagnosis ── */}
          <SubCard title="Combined Specialist Diagnosis" color="indigo">
            <p className="text-xs text-gray-500 -mt-2 mb-4">Auto-compiled from Eye, Dental and ENT selections</p>
            <div className="bg-white rounded-xl border-2 border-indigo-200 p-4 min-h-[80px] text-sm text-gray-800 whitespace-pre-line font-medium">
              {data.combinedDiagnosis || <span className="text-gray-400 font-normal">Will populate as you complete the specialist sections above…</span>}
            </div>
            <div className="mt-3">
              <FieldLabel label="Additional / Clinician Notes"/>
              <textarea value={data.combinedDiagnosisExtra} onChange={e=>upd('combinedDiagnosisExtra',e.target.value)} rows="3"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="Any additional clinical notes or observations…"/>
            </div>
          </SubCard>

          {/* ── 6. ENT Treatment ── */}
          <SubCard title="ENT Treatment / Recommendations" color="pink">
            <CheckGroup
              options={['Neohycolex ear drop','Boric acid ear drop','Nostamine ear drop','Betacort nasal drop','Ascorbic acid','Amoxiclav suspension','Candibiotic ear drop','Cetirizine syrup','Ephedrine nasal drop','Ibuprofen']}
              values={data.ent.treatment} onChange={v=>updN('ent','treatment',v)}
              extra extraVal={data.ent.treatmentExtra} onExtra={v=>updN('ent','treatmentExtra',v)}/>
          </SubCard>

          {/* ── 7. Referral ── */}
          <SubCard title="Did You Refer the Child?" color="teal">
            <div className="flex gap-3">
              {['Yes','No'].map(opt => (
                <button key={opt} type="button"
                  onClick={() => updN('referral','referred', data.referral.referred === opt ? '' : opt)}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm border-2 transition-all ${
                    data.referral.referred === opt
                      ? opt === 'Yes' ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-gray-500 text-white border-gray-500 shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'
                  }`}>
                  {opt === 'Yes' ? '✓ Yes' : '✗ No'}
                </button>
              ))}
            </div>
          </SubCard>

        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-xs">© 2024 Benkrom Pentecost Child & Youth Development Centre • Confidential</p>
        </div>
      </div>
    </div>
  )
}