import { useState } from 'react';

export default function Section2({ patientId, patient }) {
  const [formData, setFormData] = useState({
    // Hematology
    hemoglobin: '',
    hematocrit: '',
    wbcCount: '',
    rbcCount: '',
    plateletCount: '',
    
    // Blood Chemistry
    bloodGlucose: '',
    bloodUrea: '',
    creatinine: '',
    sodium: '',
    potassium: '',
    calcium: '',
    
    // Liver Function
    alt: '',
    ast: '',
    alkalinePhosphatase: '',
    totalBilirubin: '',
    
    // Urinalysis
    urineColor: '',
    urineClarity: '',
    urineProtein: '',
    urineGlucose: '',
    urineBlood: '',
    urinePH: '',
    
    // Other Tests
    malariaTest: '',
    hivTest: '',
    tuberculosisTest: '',
    stoolExam: '',
    
    labNotes: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Section 2 Data:', formData);
    alert('Section 2 saved successfully!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* Hematology */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Hematology</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hemoglobin (g/dL)</label>
            <input
              type="number"
              step="0.1"
              name="hemoglobin"
              value={formData.hemoglobin}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g., 12.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hematocrit (%)</label>
            <input
              type="number"
              step="0.1"
              name="hematocrit"
              value={formData.hematocrit}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g., 38.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WBC Count (×10³/μL)</label>
            <input
              type="number"
              step="0.1"
              name="wbcCount"
              value={formData.wbcCount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g., 7.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RBC Count (×10⁶/μL)</label>
            <input
              type="number"
              step="0.01"
              name="rbcCount"
              value={formData.rbcCount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g., 4.50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platelet Count (×10³/μL)</label>
            <input
              type="number"
              name="plateletCount"
              value={formData.plateletCount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g., 250"
            />
          </div>
        </div>
      </div>

      {/* Blood Chemistry */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Blood Chemistry</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Glucose (mg/dL)</label>
            <input
              type="number"
              name="bloodGlucose"
              value={formData.bloodGlucose}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g., 95"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Urea (mg/dL)</label>
            <input
              type="number"
              step="0.1"
              name="bloodUrea"
              value={formData.bloodUrea}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g., 25.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Creatinine (mg/dL)</label>
            <input
              type="number"
              step="0.1"
              name="creatinine"
              value={formData.creatinine}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g., 0.8"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sodium (mEq/L)</label>
            <input
              type="number"
              step="0.1"
              name="sodium"
              value={formData.sodium}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g., 140.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Potassium (mEq/L)</label>
            <input
              type="number"
              step="0.1"
              name="potassium"
              value={formData.potassium}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g., 4.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calcium (mg/dL)</label>
            <input
              type="number"
              step="0.1"
              name="calcium"
              value={formData.calcium}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g., 9.5"
            />
          </div>
        </div>
      </div>

      {/* Liver Function Tests */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Liver Function Tests</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ALT (U/L)</label>
            <input
              type="number"
              name="alt"
              value={formData.alt}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g., 30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AST (U/L)</label>
            <input
              type="number"
              name="ast"
              value={formData.ast}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g., 28"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alkaline Phosphatase (U/L)</label>
            <input
              type="number"
              name="alkalinePhosphatase"
              value={formData.alkalinePhosphatase}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g., 80"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Bilirubin (mg/dL)</label>
            <input
              type="number"
              step="0.1"
              name="totalBilirubin"
              value={formData.totalBilirubin}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g., 0.8"
            />
          </div>
        </div>
      </div>

      {/* Urinalysis */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Urinalysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <select
              name="urineColor"
              value={formData.urineColor}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="">Select...</option>
              <option value="pale-yellow">Pale Yellow</option>
              <option value="yellow">Yellow</option>
              <option value="amber">Amber</option>
              <option value="dark-yellow">Dark Yellow</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clarity</label>
            <select
              name="urineClarity"
              value={formData.urineClarity}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="">Select...</option>
              <option value="clear">Clear</option>
              <option value="slightly-cloudy">Slightly Cloudy</option>
              <option value="cloudy">Cloudy</option>
              <option value="turbid">Turbid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">pH</label>
            <input
              type="number"
              step="0.1"
              name="urinePH"
              value={formData.urinePH}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="e.g., 6.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Protein</label>
            <select
              name="urineProtein"
              value={formData.urineProtein}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="">Select...</option>
              <option value="negative">Negative</option>
              <option value="trace">Trace</option>
              <option value="1+">1+</option>
              <option value="2+">2+</option>
              <option value="3+">3+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Glucose</label>
            <select
              name="urineGlucose"
              value={formData.urineGlucose}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="">Select...</option>
              <option value="negative">Negative</option>
              <option value="trace">Trace</option>
              <option value="1+">1+</option>
              <option value="2+">2+</option>
              <option value="3+">3+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood</label>
            <select
              name="urineBlood"
              value={formData.urineBlood}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="">Select...</option>
              <option value="negative">Negative</option>
              <option value="trace">Trace</option>
              <option value="1+">1+</option>
              <option value="2+">2+</option>
              <option value="3+">3+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Other Tests */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Other Laboratory Tests</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Malaria Test</label>
            <select
              name="malariaTest"
              value={formData.malariaTest}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="">Select...</option>
              <option value="negative">Negative</option>
              <option value="positive">Positive</option>
              <option value="not-done">Not Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HIV Test</label>
            <select
              name="hivTest"
              value={formData.hivTest}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="">Select...</option>
              <option value="negative">Negative</option>
              <option value="positive">Positive</option>
              <option value="not-done">Not Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tuberculosis Test</label>
            <select
              name="tuberculosisTest"
              value={formData.tuberculosisTest}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="">Select...</option>
              <option value="negative">Negative</option>
              <option value="positive">Positive</option>
              <option value="not-done">Not Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stool Examination</label>
            <input
              type="text"
              name="stoolExam"
              value={formData.stoolExam}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Enter findings..."
            />
          </div>
        </div>
      </div>

      {/* Lab Notes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Laboratory Notes</h3>
        <textarea
          name="labNotes"
          value={formData.labNotes}
          onChange={handleChange}
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          placeholder="Add any additional laboratory notes or observations..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition"
        >
          Save Section 2
        </button>
        <button
          type="button"
          className="px-6 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition"
        >
          Save as Draft
        </button>
      </div>
    </form>
  );
}