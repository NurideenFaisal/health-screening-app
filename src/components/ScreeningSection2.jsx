import React, { useState } from 'react';

const ImmunizationSection = () => {
  // Updated immunization list without JAP, TYP, VAR
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

  const [formData, setFormData] = useState({
    immunizations: immunizationList.reduce((acc, vaccine) => {
      acc[vaccine.code] = { received: false };
      return acc;
    }, {}),
    childhoodImmunizationComplete: false,
    vitaminA: '',
    deworming: ''
  });

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

  const handleSelectAll = () => {
    const allSelected = immunizationList.reduce((acc, vaccine) => {
      acc[vaccine.code] = { received: true };
      return acc;
    }, {});
    setFormData(prev => ({
      ...prev,
      immunizations: allSelected
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Immunization Record</h2>
          <p className="text-sm text-gray-600">Vaccination history and supplements</p>
        </div>
      </div>

      {/* Immunization Grid */}
      <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Vaccines Received</h3>
          <button
            onClick={handleSelectAll}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Select All
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {immunizationList.map(vaccine => (
            <div key={vaccine.code} className="bg-white rounded-lg p-2.5 border border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.immunizations[vaccine.code].received}
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
          <label className="flex items-center gap-3 cursor-pointer bg-white rounded-lg p-3 border-2 border-gray-200 hover:border-emerald-300">
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
    </div>
  );
};

export default ImmunizationSection;