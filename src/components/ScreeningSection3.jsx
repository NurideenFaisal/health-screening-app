import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useScreeningSection } from '../hooks/useScreeningSection'

const INITIAL = {
  majorFindings: '',
  skinExamination: '',
  diagnosisOptions: {
    normalExamination: false, urti: false, asthma: false,
    sickleCellDisease: false, umbilicalHernia: false, inguinalHernia: false,
    scabies: false, eczema: false, psoriasis: false, malaria: false, other: false
  },
  diagnosisOtherText: '',
  treatmentGiven: {
    syrupMetronidazole: false, syrupCarbocysteine: false, syrupAL20120: false,
    syrupAscorbicAcid: false, syrupSalbutamol: false, syrupAmoxycillin: false,
    syrupParacetamol: false, syrupIbuprofen: false, funbactCream: false,
    amoxiclav: false, citirizine: false, tabAL2020: false,
    tabAL40240: false, albendazoleSyrup: false, miconazoleCream: false
  },
  referralChild: '',
  recommendations: '',
  doctorName: 'Dr. Matilda Awingura Akanzum',
  doctorSignature: 'MAA',
  signDate: new Date().toISOString().split('T')[0]
}

export default function SummaryDiagnosis() {
  // Get context from ClinicianScreeningForm
  const { patientId, cycleId } = useOutletContext()
  
  // Use the new normalized hook - Section 3 = Diagnosis
  const { 
    sectionData, 
    isComplete, 
    isLoading, 
    save, 
    isSaving 
  } = useScreeningSection({
    childId: patientId,
    cycleId,
    sectionNumber: 3, // Diagnosis
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

  const updateField = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const updateNested = (parent, key, value) =>
    setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: value } }))

  async function handleSave() {
    try {
      await save({ sectionData: formData, isComplete: false })
      alert('Saved successfully!')
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save: ' + err.message)
    }
  }

  async function handleSaveAndComplete() {
    try {
      await save({ sectionData: formData, isComplete: true })
      alert('Section marked as complete!')
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save: ' + err.message)
    }
  }

  const diagnosisList = [
    { key: 'normalExamination', label: 'Normal Examination Findings' },
    { key: 'urti', label: 'URTI (Upper Respiratory Tract Infection)' },
    { key: 'asthma', label: 'Asthma' },
    { key: 'sickleCellDisease', label: 'Sickle Cell Disease' },
    { key: 'umbilicalHernia', label: 'Umbilical Hernia' },
    { key: 'inguinalHernia', label: 'Inguinal Hernia' },
    { key: 'scabies', label: 'Scabies' },
    { key: 'eczema', label: 'Eczema' },
    { key: 'psoriasis', label: 'Psoriasis' },
    { key: 'malaria', label: 'Malaria' },
    { key: 'other', label: 'Other' },
  ]

  const treatmentList = [
    { key: 'syrupMetronidazole', label: 'Syrup Metronidazole 125mg' },
    { key: 'syrupCarbocysteine', label: 'Syrup Carbocysteine' },
    { key: 'syrupAL20120', label: 'Syrup A/L 20/120mg' },
    { key: 'syrupAscorbicAcid', label: 'Syrup Ascorbic Acid' },
    { key: 'syrupSalbutamol', label: 'Syrup Salbutamol' },
    { key: 'syrupAmoxycillin', label: 'Syrup Amoxycillin' },
    { key: 'syrupParacetamol', label: 'Syrup Paracetamol 125mg' },
    { key: 'syrupIbuprofen', label: 'Syrup Ibuprofen 200mg' },
    { key: 'funbactCream', label: 'Funbact Cream' },
    { key: 'amoxiclav', label: 'Amoxiclav' },
    { key: 'citirizine', label: 'Citirizine' },
    { key: 'tabAL2020', label: 'Tab A/L 20/20' },
    { key: 'tabAL40240', label: 'Tab A/L 40/240' },
    { key: 'albendazoleSyrup', label: 'Albendazole Syrup' },
    { key: 'miconazoleCream', label: 'Miconazole Cream' },
  ]

  const CheckboxCard = ({ checked, onChange, label, activeClass }) => (
    <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all duration-150 ${
      checked ? activeClass : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <input type="checkbox" checked={checked} onChange={onChange}
        className="w-5 h-5 rounded border-gray-300 accent-teal-600" />
      <span className="text-sm font-medium text-gray-800">{label}</span>
    </label>
  )

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
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Summary, Diagnosis & Treatment</h1>
              {isComplete && (
                <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full mt-1">
                  ✓ Complete
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 space-y-6">
          {/* Major Findings */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Major Findings
            </label>
            <textarea
              value={formData.majorFindings}
              onChange={e => updateField('majorFindings', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
              placeholder="Enter major findings..."
            />
          </div>

          {/* Skin Examination */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Skin Examination
            </label>
            <textarea
              value={formData.skinExamination}
              onChange={e => updateField('skinExamination', e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
              placeholder="Enter skin examination findings..."
            />
          </div>

          {/* Diagnosis Options */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Diagnosis
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {diagnosisList.map(item => (
                <CheckboxCard
                  key={item.key}
                  checked={formData.diagnosisOptions[item.key]}
                  onChange={e => updateNested('diagnosisOptions', item.key, e.target.checked)}
                  label={item.label}
                  activeClass="bg-teal-50 border-teal-500"
                />
              ))}
            </div>
            {formData.diagnosisOptions.other && (
              <input
                type="text"
                value={formData.diagnosisOtherText}
                onChange={e => updateField('diagnosisOtherText', e.target.value)}
                placeholder="Specify other diagnosis..."
                className="mt-3 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            )}
          </div>

          {/* Treatment Given */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Treatment Given
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {treatmentList.map(item => (
                <CheckboxCard
                  key={item.key}
                  checked={formData.treatmentGiven[item.key]}
                  onChange={e => updateNested('treatmentGiven', item.key, e.target.checked)}
                  label={item.label}
                  activeClass="bg-amber-50 border-amber-500"
                />
              ))}
            </div>
          </div>

          {/* Referral */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Did you refer the child?
            </label>
            <div className="flex gap-3">
              {['Yes', 'No'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateField('referralChild', opt)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                    formData.referralChild === opt
                      ? opt === 'Yes' ? 'bg-teal-600 text-white border-teal-600' : 'bg-gray-500 text-white border-gray-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'
                  }`}
                >
                  {opt === 'Yes' ? '✓ Yes' : '✗ No'}
                </button>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Recommendations
            </label>
            <textarea
              value={formData.recommendations}
              onChange={e => updateField('recommendations', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
              placeholder="Enter recommendations..."
            />
          </div>

          {/* Doctor Signature */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Doctor's Name</label>
              <input
                type="text"
                value={formData.doctorName}
                onChange={e => updateField('doctorName', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Signature</label>
              <input
                type="text"
                value={formData.doctorSignature}
                onChange={e => updateField('doctorSignature', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={formData.signDate}
                onChange={e => updateField('signDate', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
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
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
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
