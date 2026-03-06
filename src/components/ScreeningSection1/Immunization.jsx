import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Syringe } from 'lucide-react';
import { useScreeningSection } from '../../hooks/useScreeningSection';

const immunizationList = [
  { code: 'BCG', name: 'Bacillus Calmette-Guérin' },
  { code: 'HepB', name: 'Hepatitis B' },
  { code: 'DTP', name: 'Diphtheria, Tetanus, Pertussis' },
  { code: 'OPV', name: 'Oral Polio Vaccine' },
  { code: 'IPV', name: 'Inactivated Polio Vaccine' },
  { code: 'Hib', name: 'Haemophilus influenzae type b' },
  { code: 'PCV', name: 'Pneumococcal Conjugate Vaccine' },
  { code: 'RV', name: 'Rotavirus Vaccine' },
  { code: 'MMR', name: 'Measles, Mumps, Rubella' },
  { code: 'MR', name: 'Measles, Rubella' },
  { code: 'HPV', name: 'Human Papillomavirus' },
  { code: 'TD', name: 'Tetanus, Diphtheria' }
];

const timeOptions = [
  { label: '6 months ago', value: '6_months' },
  { label: '1 year ago', value: '1_year' },
  { label: '2 years ago', value: '2_years' },
  { label: '5 years ago', value: '5_years' }
];

const INITIAL = {
  immunizations: immunizationList.reduce((acc, vaccine) => {
    acc[vaccine.code] = { received: false };
    return acc;
  }, {}),
  childhoodImmunizationComplete: false,
  vitaminA: '',
  deworming: ''
};

const ImmunizationSection = () => {
  // Get context from ClinicianScreeningForm
  const { patientId, cycleId } = useOutletContext()
  
  // Use the new normalized hook - Immunization is part of Section 1
  const { 
    sectionData, 
    isComplete, 
    isLoading, 
    save, 
    isSaving 
  } = useScreeningSection({
    childId: patientId,
    cycleId,
    sectionNumber: 1, // Part of Section 1
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

  // Helper to determine if all vaccines are currently checked
  const isAllSelected = immunizationList.every(
    vaccine => formData.immunizations[vaccine.code]?.received
  );

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent, key, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [key]: value
      }
    }));
  };

  // Toggle Select/Deselect All
  const handleToggleAll = () => {
    const newState = !isAllSelected;
    const updatedImmunizations = immunizationList.reduce((acc, vaccine) => {
      acc[vaccine.code] = { received: newState };
      return acc;
    }, {});

    setFormData(prev => ({
      ...prev,
      immunizations: updatedImmunizations,
      childhoodImmunizationComplete: newState 
    }));
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Syringe className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Immunization Record</h2>
          <p className="text-sm text-gray-600">Vaccination history and supplements</p>
        </div>
        {isComplete && (
          <span className="ml-auto px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
            ✓ Complete
          </span>
        )}
      </div>

      {/* Immunization Grid */}
      <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Vaccines Received</h3>
          <button
            onClick={handleToggleAll}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors shadow-sm ${
              isAllSelected 
                ? "bg-emerald-400 text-red-700 border border-emerald-200 hover:bg-emerald-100" 
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {immunizationList.map(vaccine => (
            <div key={vaccine.code} className="bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.immunizations[vaccine.code]?.received || false}
                  onChange={(e) => updateNestedField('immunizations', vaccine.code, {
                    received: e.target.checked
                  })}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900">{vaccine.code}</div>
                  <div className="text-xs text-gray-600 truncate">{vaccine.name}</div>
                </div>
              </label>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-emerald-200">
          <label className="flex items-center gap-3 cursor-pointer bg-white rounded-lg p-3 border-2 border-gray-200 hover:border-emerald-300 transition-colors">
            <input
              type="checkbox"
              checked={formData.childhoodImmunizationComplete}
              onChange={(e) => updateField('childhoodImmunizationComplete', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-sm font-semibold text-gray-900">Childhood Immunization Up to Date</span>
          </label>
        </div>
      </div>

      {/* Vitamins & Deworming */}
      <div className="bg-teal-50 rounded-2xl p-5 border border-teal-100">
        <h3 className="font-semibold text-gray-900 mb-4">Vitamin & Deworming History</h3>

        <div className="space-y-4">
          {/* Vitamin A */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vitamin A - Last Dose Received
            </label>
            <div className="grid grid-cols-2 gap-2">
              {timeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => updateField('vitaminA', option.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.vitaminA === option.value
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-teal-400'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deworming */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deworming - Last Dose Received
            </label>
            <div className="grid grid-cols-2 gap-2">
              {timeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => updateField('deworming', option.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.deworming === option.value
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-teal-400'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save (Draft)'}
        </button>
        <button
          onClick={handleSaveAndComplete}
          disabled={isSaving}
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save & Complete'}
        </button>
      </div>
    </div>
  );
};

export default ImmunizationSection;
