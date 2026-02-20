import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'

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
  signsOfAbuse: 'no',
  signsOfAbuseComment: '',
  systemExplanation: '',
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

  function handleSave() {
    console.log('Save vitals:', formData)
    onComplete()
  }

  return (
    <div className="relative">

      {/* ── Scrollable form ── */}
      <div className="space-y-6 pb-24">

        {/* Vital Signs */}
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Vital Signs
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'weight', label: 'Weight (kg)', type: 'number', step: '0.1', placeholder: '' },
              { key: 'height', label: 'Height (cm)', type: 'number', step: '0.1', placeholder: '' },
              { key: 'temperature', label: 'Temperature (°C)', type: 'number', step: '0.1', placeholder: '' },
              { key: 'pulse', label: 'Pulse (bpm)', type: 'number', step: '1', placeholder: '' },
              { key: 'respiration', label: 'Respiration', type: 'number', step: '1', placeholder: '' },
              { key: 'bloodPressure', label: 'Blood Pressure (12+ yrs)', type: 'text', placeholder: '' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  step={f.step}
                  value={formData[f.key]}
                  onChange={e => updateField(f.key, e.target.value)}
                  placeholder={f.placeholder}
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

        {/* Past Medical / Surgical History */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Past Medical / Surgical History</label>
          <textarea
            value={formData.medicalHistory}
            onChange={e => updateField('medicalHistory', e.target.value)}
            rows={3}
            placeholder="Enter any relevant medical or surgical history"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
          />
          <label className="flex items-center gap-2 mt-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.noMedicalHistory}
              onChange={e => updateField('noMedicalHistory', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-gray-600 group-hover:text-emerald-700 italic">
              No past medical / surgical history of relevance
            </span>
          </label>
        </div>

        {/* Physical Appearance */}
        <div className="bg-teal-50 rounded-2xl p-5 border border-teal-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
            Physical Appearance
          </h3>
          <label className="flex items-center gap-2 mb-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.physicalAppearance.normalAppearance}
              onChange={e => updateNestedField('physicalAppearance', 'normalAppearance', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-sm font-semibold text-teal-800">Normal Physical Appearance</span>
          </label>
          {!formData.physicalAppearance.normalAppearance && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['edema', 'jaundiced', 'lethargic', 'pallor', 'skinProblem', 'other'].map(item => (
                <label key={item} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.physicalAppearance[item]}
                    onChange={e => updateNestedField('physicalAppearance', item, e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-teal-700 capitalize">
                    {item === 'skinProblem' ? 'Skin Problem' : item}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Physical Examination */}
        <div className="bg-cyan-50 rounded-2xl p-5 border border-cyan-100">
          <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
            Physical Examination
          </h3>
          <p className="text-xs text-gray-500 mb-4">Tick if abnormal, then provide a comment</p>
          <label className="flex items-center gap-2 mb-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.physicalExam.normalExam}
              onChange={e => updateNestedField('physicalExam', 'normalExam', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-2 focus:ring-cyan-500"
            />
            <span className="text-sm font-semibold text-cyan-800">Normal Physical Examination</span>
          </label>
          {!formData.physicalExam.normalExam && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'head', label: 'Head' },
                { key: 'chest', label: 'Chest' },
                { key: 'abdomen', label: 'Abdomen' },
                { key: 'genitourinary', label: 'Genitourinary' },
                { key: 'superiorExtremities', label: 'Superior Extremities' },
                { key: 'inferiorExtremities', label: 'Inferior Extremities' },
                { key: 'mentalHealthStatus', label: 'Mental Health Status' },
              ].map(field => (
                <div key={field.key}
                  className={`bg-white rounded-xl p-3 border transition-all
                    ${formData.physicalExam[field.key].abnormal ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
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
                      className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-2 focus:ring-red-300"
                    />
                    <span className={`text-sm font-semibold ${formData.physicalExam[field.key].abnormal ? 'text-red-700' : 'text-gray-700'}`}>
                      {field.label}
                      {formData.physicalExam[field.key].abnormal &&
                        <span className="ml-2 text-xs font-normal bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Abnormal</span>}
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

        {/* Body Systems Disturbance */}
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            Body Systems Disturbance
          </h3>
          <label className="flex items-center gap-2 mb-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.bodySystems.noDisturbances}
              onChange={e => updateNestedField('bodySystems', 'noDisturbances', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-sm font-semibold text-emerald-800">No Body System Disturbances</span>
          </label>
          {!formData.bodySystems.noDisturbances && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.keys(formData.bodySystems).filter(s => s !== 'noDisturbances').map(system => (
                  <label key={system} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.bodySystems[system]}
                      onChange={e => updateNestedField('bodySystems', system, e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">
                      {system.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                    </span>
                  </label>
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

        {/* Signs of Abuse / Neglect */}
        <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            Signs of Abuse / Neglect
          </h3>
          <div className="flex gap-6 mb-3">
            {['yes', 'no'].map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="signsOfAbuse"
                  value={opt}
                  checked={formData.signsOfAbuse === opt}
                  onChange={() => updateField('signsOfAbuse', opt)}
                  className="w-4 h-4 border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-400"
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

      </div>

      {/* ── Sticky Save & Next button ── */}
      <div className="pt-0 border-t border-gray-100">
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