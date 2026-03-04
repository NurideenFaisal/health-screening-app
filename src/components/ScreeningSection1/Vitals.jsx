import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Activity } from 'lucide-react'

function calculateAge(birthdate) {
  if (!birthdate) return null
  const today = new Date()
  const birth = new Date(birthdate)
  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  if (months < 0) { years--; months += 12 }
  return { years, months }
}

const INITIAL = {
  weight: '',
  height: '',
  temperature: '',
  pulse: '',
  bmi: '',
  respiration: '',
  bloodPressure: '',
  headCircumference: '',
  vitalComment: '',
  medicalHistory: '',
  noMedicalHistory: false,
  physicalAppearance: {
    normalAppearance: false,
    edema: false,
    jaundiced: false,
    lethargic: false,
    pallor: false,
    skinProblem: false,
    other: false,
  },
  physicalExam: {
    normalExam: false,
    head: { abnormal: false, comment: '' },
    chest: { abnormal: false, comment: '' },
    abdomen: { abnormal: false, comment: '' },
    genitourinary: { abnormal: false, comment: '' },
    superiorExtremities: { abnormal: false, comment: '' },
    inferiorExtremities: { abnormal: false, comment: '' },
    mentalHealthStatus: { abnormal: false, comment: '' },
  },
  bodySystems: {
    noDisturbances: false,
    auditory: false,
    circulatorySystem: false,
    digestiveSystem: false,
    endocrineSystem: false,
    lymphaticSystem: false,
    musculoskeletalSystem: false,
    nervousSystem: false,
    reproductiveSystem: false,
    respiratorySystem: false,
    skin: false,
    urinarySystem: false,
    vision: false,
  },
  systemExplanation: '',
  signsOfAbuse: 'no',
  signsOfAbuseComment: '',
}

export default function Vitals() {
  const { patientId, onComplete, screening } = useOutletContext()
  const [formData, setFormData] = useState(INITIAL)

  const child = screening?.child || {}
  const age = calculateAge(child.birthdate)

  // Auto-calculate BMI
  useEffect(() => {
    const w = parseFloat(formData.weight)
    const h = parseFloat(formData.height)
    if (w > 0 && h > 0) {
      const bmi = (w / Math.pow(h / 100, 2)).toFixed(1)
      setFormData(prev => ({ ...prev, bmi }))
    } else {
      setFormData(prev => ({ ...prev, bmi: '' }))
    }
  }, [formData.weight, formData.height])

  function updateField(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  function updateNestedField(parent, key, value) {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value }
    }))
  }

  // Transform UI state into backend-ready JSON
  function buildPayload() {
    return {
      vitals: {
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        bmi: formData.bmi ? parseFloat(formData.bmi) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        pulse: formData.pulse ? parseInt(formData.pulse) : null,
        respiration: formData.respiration ? parseInt(formData.respiration) : null,
        bloodPressure: formData.bloodPressure || null,
        headCircumference: formData.headCircumference || null,
        comment: formData.vitalComment || null,
      },
      medicalHistory: {
        hasHistory: !formData.noMedicalHistory,
        details: formData.noMedicalHistory ? null : formData.medicalHistory || null,
      },
      physicalAppearance: { ...formData.physicalAppearance },
      physicalExam: { ...formData.physicalExam },
      bodySystems: {
        noDisturbances: formData.bodySystems.noDisturbances,
        disturbances: Object.fromEntries(
          Object.entries(formData.bodySystems)
            .filter(([k]) => k !== 'noDisturbances')
            .map(([k, v]) => [k, v])
        ),
        explanation: formData.systemExplanation || null,
      },
      signsOfAbuse: {
        observed: formData.signsOfAbuse === 'yes',
        comment: formData.signsOfAbuse === 'yes' ? formData.signsOfAbuseComment || null : null,
      },
      age,
    }
  }

  function handleSave() {
    const payload = buildPayload()
    console.log('Backend-ready JSON:', payload)
    onComplete(payload)
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Activity className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bofld text-gray-900">Vitals Record</h2>
          <p className="text-sm text-gray-600">Vital signs and physical examination</p>
        </div>
      </div>

      {/* ── Vital Signs ── */}
      <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          Vital Signs
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { key: 'weight',      label: 'Weight (kg)',            type: 'number', step: '0.1' },
            { key: 'height',      label: 'Height (cm)',            type: 'number', step: '0.1' },
            { key: 'temperature', label: 'Temperature (°C)',       type: 'number', step: '0.1' },
            { key: 'pulse',       label: 'Pulse (bpm)',            type: 'number', step: '1'   },
            { key: 'respiration', label: 'Respiration',            type: 'number', step: '1'   },
            { key: 'bloodPressure', label: 'Blood Pressure (12+ yrs)', type: 'text' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">{f.label}</label>
              <input
                type={f.type}
                step={f.step}
                value={formData[f.key]}
                onChange={e => updateField(f.key, e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </div>
          ))}

          {/* BMI — auto calculated */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              BMI (kg/m²) <span className="text-emerald-500 font-normal">auto</span>
            </label>
            <input
              type="text"
              value={formData.bmi}
              readOnly
              placeholder="—"
              className="w-full px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-semibold outline-none cursor-default"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Head Circumference</label>
            <input
              type="text"
              value={formData.headCircumference}
              onChange={e => updateField('headCircumference', e.target.value)}
              placeholder="Enter measurement"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Comment</label>
          <textarea
            value={formData.vitalComment}
            onChange={e => updateField('vitalComment', e.target.value)}
            rows={2}
            placeholder="Additional notes on vital signs"
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
          />
        </div>
      </div>

      {/* ── Past Medical / Surgical History ── */}
      <div className="bg-teal-50 rounded-2xl p-5 border border-teal-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
          Past Medical / Surgical History
        </h3>
        <textarea
          value={formData.medicalHistory}
          onChange={e => updateField('medicalHistory', e.target.value)}
          rows={3}
          placeholder="Enter any relevant medical or surgical history"
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
        />
        <label className="flex items-center gap-2 mt-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.noMedicalHistory}
            onChange={e => updateField('noMedicalHistory', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500 cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-600 group-hover:text-teal-700 italic">
            No past medical / surgical history of relevance
          </span>
        </label>
      </div>

      {/* ── Physical Appearance ── */}
      <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          Physical Appearance
        </h3>
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.physicalAppearance.normalAppearance}
            onChange={e => updateNestedField('physicalAppearance', 'normalAppearance', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          />
          <span className="text-sm font-semibold text-emerald-800">Normal Physical Appearance</span>
        </label>
        {!formData.physicalAppearance.normalAppearance && (
          <div className="grid grid-cols-2 gap-2">
            {['edema', 'jaundiced', 'lethargic', 'pallor', 'skinProblem', 'other'].map(item => (
              <div key={item} className="bg-white rounded-lg p-2.5 border border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.physicalAppearance[item]}
                    onChange={e => updateNestedField('physicalAppearance', item, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {item === 'skinProblem' ? 'Skin Problem' : item}
                  </span>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Physical Examination ── */}
      <div className="bg-teal-50 rounded-2xl p-5 border border-teal-100">
        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
          Physical Examination
        </h3>
        <p className="text-xs text-gray-500 mb-4">Tick if abnormal, then provide a comment</p>
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.physicalExam.normalExam}
            onChange={e => updateNestedField('physicalExam', 'normalExam', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500 cursor-pointer"
          />
          <span className="text-sm font-semibold text-teal-800">Normal Physical Examination</span>
        </label>
        {!formData.physicalExam.normalExam && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'head',                label: 'Head' },
              { key: 'chest',               label: 'Chest' },
              { key: 'abdomen',             label: 'Abdomen' },
              { key: 'genitourinary',       label: 'Genitourinary' },
              { key: 'superiorExtremities', label: 'Superior Extremities' },
              { key: 'inferiorExtremities', label: 'Inferior Extremities' },
              { key: 'mentalHealthStatus',  label: 'Mental Health Status' },
            ].map(field => (
              <div
                key={field.key}
                className={`bg-white rounded-lg p-2.5 border transition-all ${
                  formData.physicalExam[field.key].abnormal
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200'
                }`}
              >
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={formData.physicalExam[field.key].abnormal}
                    onChange={e => {
                      if (e.target.checked) updateNestedField('physicalExam', 'normalExam', false)
                      updateNestedField('physicalExam', field.key, {
                        ...formData.physicalExam[field.key],
                        abnormal: e.target.checked,
                        comment: e.target.checked ? formData.physicalExam[field.key].comment : ''
                      })
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-2 focus:ring-red-300 cursor-pointer"
                  />
                  <span className={`text-sm font-semibold ${formData.physicalExam[field.key].abnormal ? 'text-red-700' : 'text-gray-700'}`}>
                    {field.label}
                    {formData.physicalExam[field.key].abnormal && (
                      <span className="ml-2 text-xs font-normal bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Abnormal</span>
                    )}
                  </span>
                </label>
                {formData.physicalExam[field.key].abnormal && (
                  <input
                    type="text"
                    value={formData.physicalExam[field.key].comment}
                    onChange={e => updateNestedField('physicalExam', field.key, {
                      ...formData.physicalExam[field.key], comment: e.target.value
                    })}
                    placeholder="Describe abnormal finding..."
                    autoFocus
                    className="w-full px-2.5 py-2 bg-white border border-red-200 rounded-lg text-gray-900 text-xs focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Body Systems Disturbance ── */}
      <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          Body Systems Disturbance
        </h3>
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.bodySystems.noDisturbances}
            onChange={e => updateNestedField('bodySystems', 'noDisturbances', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          />
          <span className="text-sm font-semibold text-emerald-800">No Body System Disturbances</span>
        </label>
        {!formData.bodySystems.noDisturbances && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(formData.bodySystems).filter(s => s !== 'noDisturbances').map(system => (
                <div key={system} className="bg-white rounded-lg p-2.5 border border-gray-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.bodySystems[system]}
                      onChange={e => updateNestedField('bodySystems', system, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {system.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                    </span>
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Explanation / General Comment</label>
              <textarea
                value={formData.systemExplanation}
                onChange={e => updateField('systemExplanation', e.target.value)}
                rows={3}
                placeholder="Provide details about body system disturbances"
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </div>
          </>
        )}
      </div>

      {/* ── Signs of Abuse / Neglect ── */}
      <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
          Signs of Abuse / Neglect
        </h3>
        <div className="flex gap-6 mb-3">
          {['yes', 'no'].map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="signsOfAbuse"
                value={opt}
                checked={formData.signsOfAbuse === opt}
                onChange={() => updateField('signsOfAbuse', opt)}
                className="w-4 h-4 border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-400 cursor-pointer"
              />
              <span className={`text-sm font-semibold capitalize ${opt === 'yes' ? 'text-red-700' : 'text-emerald-700'}`}>
                {opt === 'yes' ? 'Yes' : 'No'}
              </span>
            </label>
          ))}
        </div>
        {formData.signsOfAbuse === 'yes' && (
          <div className="mt-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Please describe the observed signs</label>
            <textarea
              value={formData.signsOfAbuseComment}
              onChange={e => updateField('signsOfAbuseComment', e.target.value)}
              rows={3}
              placeholder="Describe the type, location, and nature of signs observed..."
              autoFocus
              className="w-full px-3 py-2.5 bg-white border border-orange-200 rounded-lg text-gray-900 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
            />
          </div>
        )}
      </div>

      {/* ── Save & Next ── */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Save & Next →
        </button>
      </div>

    </div>
  )
}