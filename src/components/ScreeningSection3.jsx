import { useState } from 'react'

export default function SummaryDiagnosis() {
  const [formData, setFormData] = useState({
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
  })

  const updateField = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const updateNested = (parent, key, value) =>
    setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: value } }))

  const handleSubmit = () => alert('Section 6 submitted successfully!')

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 py-8 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10 space-y-6">

        {/* Header */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-0.5">Section 6</p>
              <h1 className="text-2xl font-bold text-gray-900">Summary & Diagnosis</h1>
              <p className="text-sm text-gray-500 mt-0.5">Benkrom Pentecost Child & Youth Development Centre</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8 space-y-6">

          {/* Major Findings */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Major Findings from General Examination</label>
            <textarea
              value={formData.majorFindings}
              onChange={e => updateField('majorFindings', e.target.value)}
              rows="4"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all resize-none"
              placeholder="Summarize key findings from the examination"
            />
          </div>

          {/* Skin Examination */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Skin Examination</label>
            <textarea
              value={formData.skinExamination}
              onChange={e => updateField('skinExamination', e.target.value)}
              rows="4"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all resize-none"
              placeholder="Describe skin examination findings"
            />
          </div>

          {/* Diagnosis */}
          <div className="bg-teal-50 rounded-2xl p-5 border border-teal-100">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-teal-500 rounded-full" />
              Diagnosis
            </h3>
            <p className="text-xs text-gray-500 mb-4">Select all that apply</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {diagnosisList.map(({ key, label }) => (
                <CheckboxCard
                  key={key}
                  checked={formData.diagnosisOptions[key]}
                  onChange={e => updateNested('diagnosisOptions', key, e.target.checked)}
                  label={label}
                  activeClass="bg-teal-100 border-teal-400"
                />
              ))}
            </div>
            {formData.diagnosisOptions.other && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Please specify other diagnosis</label>
                <input
                  type="text"
                  value={formData.diagnosisOtherText}
                  onChange={e => updateField('diagnosisOtherText', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-teal-300 rounded-xl text-gray-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all"
                  placeholder="Enter diagnosis"
                />
              </div>
            )}
          </div>

          {/* Treatment Given */}
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Treatment Given
            </h3>
            <p className="text-xs text-gray-500 mb-4">Select all that apply</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {treatmentList.map(({ key, label }) => (
                <CheckboxCard
                  key={key}
                  checked={formData.treatmentGiven[key]}
                  onChange={e => updateNested('treatmentGiven', key, e.target.checked)}
                  label={label}
                  activeClass="bg-emerald-100 border-emerald-400"
                />
              ))}
            </div>
          </div>

          {/* Referral */}
          <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full" />
              Referral
            </h3>
            <p className="text-xs text-gray-500 mb-4">Was the child referred?</p>
            <div className="flex gap-4">
              {['Yes', 'No'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateField('referralChild', opt)}
                  className={`flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 border-2 ${
                    formData.referralChild === opt
                      ? opt === 'Yes'
                        ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                        : 'bg-gray-600 border-gray-600 text-white shadow-md'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Recommendations</label>
            <textarea
              value={formData.recommendations}
              onChange={e => updateField('recommendations', e.target.value)}
              rows="4"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all resize-none"
              placeholder="Treatment plan and follow-up recommendations"
            />
          </div>

          {/* Doctor Information */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-400 rounded-full" />
              Medical Doctor Information
            </h3>
            <p className="text-xs text-gray-400 mb-4 italic">Auto-filled — read only</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Doctor Name', val: formData.doctorName },
                { label: 'Signature', val: formData.doctorSignature },
                { label: 'Date', val: formData.signDate },
              ].map(({ label, val }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                  <input readOnly value={val}
                    className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 cursor-not-allowed" />
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Submit Section
            </button>
          </div>

        </div>

        <p className="text-center text-gray-500 text-xs pb-4">
          © 2024 Health Screening • Confidential Health Information
        </p>
      </div>
    </div>
  )
}