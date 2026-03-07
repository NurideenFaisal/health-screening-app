import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { useScreeningSection } from '../../hooks/useScreeningSection'

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
  // Get context from ClinicianScreeningForm
  const { patientId, patient, cycleId } = useOutletContext()

  // LOCAL LOGIC FIX: Track which specific button was clicked
  const [isDrafting, setIsDrafting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  // Use the new normalized hook
  const {
    sectionData,
    isComplete,
    isLoading,
    save,
    isSaving
  } = useScreeningSection({
    childId: patientId,
    cycleId,
    sectionNumber: 1, // Vitals is section 1
  })

  // Initialize form with existing data or defaults
  const [formData, setFormData] = useState(() => {
    if (sectionData) {
      return { ...INITIAL, ...sectionData }
    }
    return INITIAL
  })

  // Update form when sectionData loads
  useEffect(() => {
    if (sectionData) {
      setFormData({ ...INITIAL, ...sectionData })
    }
  }, [sectionData])

  const child = patient || {}
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

  function updateDeepNestedField(parent, child, key, value) {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: { ...prev[parent][child], [key]: value }
      }
    }))
  }

  // FIXED HANDLERS: Wrap save in local loading toggles
  async function handleSave() {
    setIsDrafting(true)
    try {
      await save({ sectionData: formData, isComplete: false })
    } finally {
      setIsDrafting(false)
    }
  }

  async function handleSaveAndComplete() {
    setIsCompleting(true)
    try {
      await save({ sectionData: formData, isComplete: true })
    } finally {
      setIsCompleting(false)
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
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Activity className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vitals Record</h2>
          <p className="text-sm text-gray-600">Vital signs and physical examination</p>
        </div>
        {isComplete && (
          <span className="ml-auto px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
            ✓ Complete
          </span>
        )}
      </div>

      {/* Vital Signs */}
      <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          Vital Signs
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { key: 'weight', label: 'Weight (kg)', type: 'number', step: '0.1' },
            { key: 'height', label: 'Height (cm)', type: 'number', step: '0.1' },
            { key: 'temperature', label: 'Temperature (°C)', type: 'number', step: '0.1' },
            { key: 'pulse', label: 'Pulse (bpm)', type: 'number', step: '1' },
            { key: 'respiration', label: 'Respiration', type: 'number', step: '1' },
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

      {/* Medical History */}
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

      {/* Physical Appearance */}
      <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
          Physical Appearance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: 'normalAppearance', label: 'Normal Appearance' },
            { key: 'edema', label: 'Edema' },
            { key: 'jaundiced', label: 'Jaundiced' },
            { key: 'lethargic', label: 'Lethargic' },
            { key: 'pallor', label: 'Pallor' },
            { key: 'skinProblem', label: 'Skin Problem' },
            { key: 'other', label: 'Other' },
          ].map(f => (
            <label key={f.key} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.physicalAppearance[f.key]}
                onChange={e => updateNestedField('physicalAppearance', f.key, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-purple-700">{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Physical Exam */}
      <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
          Physical Examination
        </h3>

        <label className="flex items-center gap-2 mb-4 cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.physicalExam.normalExam}
            onChange={e => updateNestedField('physicalExam', 'normalExam', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          />
          <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-700">Normal Exam - All Within Normal Limits</span>
        </label>

        <div className="space-y-4">
          {[
            { key: 'head', label: 'Head' },
            { key: 'chest', label: 'Chest / Respiratory' },
            { key: 'abdomen', label: 'Abdomen' },
            { key: 'genitourinary', label: 'Genitourinary' },
            { key: 'superiorExtremities', label: 'Superior Extremities' },
            { key: 'inferiorExtremities', label: 'Inferior Extremities' },
            { key: 'mentalHealthStatus', label: 'Mental Health Status' },
          ].map(part => (
            <div key={part.key} className="bg-white rounded-xl p-4 border border-indigo-100">
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  checked={formData.physicalExam[part.key]?.abnormal || false}
                  onChange={e => updateDeepNestedField('physicalExam', part.key, 'abnormal', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="font-medium text-gray-900">{part.label}</span>
              </div>
              <textarea
                value={formData.physicalExam[part.key]?.comment || ''}
                onChange={e => updateDeepNestedField('physicalExam', part.key, 'comment', e.target.value)}
                placeholder="Add comments if abnormal..."
                rows={2}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Body Systems */}
      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
          Review of Body Systems
        </h3>

        <label className="flex items-center gap-2 mb-4 cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.bodySystems.noDisturbances}
            onChange={e => updateNestedField('bodySystems', 'noDisturbances', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-2 focus:ring-amber-500 cursor-pointer"
          />
          <span className="text-sm font-semibold text-gray-700 group-hover:text-amber-700">No Disturbances</span>
        </label>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: 'auditory', label: 'Auditory' },
            { key: 'circulatorySystem', label: 'Circulatory System' },
            { key: 'digestiveSystem', label: 'Digestive System' },
            { key: 'endocrineSystem', label: 'Endocrine System' },
            { key: 'lymphaticSystem', label: 'Lymphatic System' },
            { key: 'musculoskeletalSystem', label: 'Musculoskeletal System' },
            { key: 'nervousSystem', label: 'Nervous System' },
            { key: 'reproductiveSystem', label: 'Reproductive System' },
            { key: 'respiratorySystem', label: 'Respiratory System' },
            { key: 'skin', label: 'Skin' },
            { key: 'urinarySystem', label: 'Urinary System' },
            { key: 'vision', label: 'Vision' },
          ].map(f => (
            <label key={f.key} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.bodySystems[f.key]}
                onChange={e => updateNestedField('bodySystems', f.key, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-2 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 group-hover:text-amber-700">{f.label}</span>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">System Explanation</label>
          <textarea
            value={formData.systemExplanation}
            onChange={e => updateField('systemExplanation', e.target.value)}
            rows={2}
            placeholder="Explain any disturbances..."
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
          />
        </div>
      </div>

      {/* Signs of Abuse */}
      <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          Signs of Abuse / Neglect
        </h3>

        <div className="flex gap-4 mb-4">
          {[
            { value: 'no', label: 'No' },
            { value: 'suspected', label: 'Suspected' },
            { value: 'confirmed', label: 'Confirmed' },
          ].map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="signsOfAbuse"
                value={opt.value}
                checked={formData.signsOfAbuse === opt.value}
                onChange={e => updateField('signsOfAbuse', e.target.value)}
                className="w-4 h-4 border-gray-300 text-red-600 focus:ring-2 focus:ring-red-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>

        {(formData.signsOfAbuse === 'suspected' || formData.signsOfAbuse === 'confirmed') && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Comments / Details</label>
            <textarea
              value={formData.signsOfAbuseComment}
              onChange={e => updateField('signsOfAbuseComment', e.target.value)}
              rows={3}
              placeholder="Provide details about the signs observed..."
              className="w-full px-3 py-2.5 bg-white border border-red-200 rounded-lg text-gray-900 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none"
            />
          </div>
        )}
      </div>

      {/* FIXED SAVE BUTTONS: Logic Fix Implemented */}
      <div className="flex flex-row gap-4 pt-6 border-t border-gray-100 mt-8">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
        >
          {isDrafting ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            'Save Draft'
          )}
        </button>

        <button
          onClick={handleSaveAndComplete}
          disabled={isSaving}
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-emerald-100"
        >
          {isCompleting ? (
            <div className="w-4 h-4 border-2 border-emerald-200 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Complete
            </>
          )}
        </button>
      </div>

    </div>
  )
}