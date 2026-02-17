import { useState } from 'react';

export default function Section3({ patientId, patient }) {
  const [formData, setFormData] = useState({
    chiefComplaint: '',
    historyOfPresentIllness: '',
    pastMedicalHistory: '',
    familyHistory: '',
    immunizationStatus: '',
    allergies: '',
    
    clinicalImpression: '',
    provisionalDiagnosis: '',
    finalDiagnosis: '',
    differentialDiagnosis: '',
    
    treatmentPlan: '',
    medications: '',
    labInvestigations: '',
    referrals: '',
    followUpPlan: '',
    
    screeningOutcome: '',
    recommendations: '',
    doctorNotes: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Section 3 Data:', formData);
    alert('Section 3 saved successfully! Screening complete.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* Patient History */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Patient History</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
            <textarea
              name="chiefComplaint"
              value={formData.chiefComplaint}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Main reason for visit..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">History of Present Illness</label>
            <textarea
              name="historyOfPresentIllness"
              value={formData.historyOfPresentIllness}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Detailed history of current condition..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Past Medical History</label>
              <textarea
                name="pastMedicalHistory"
                value={formData.pastMedicalHistory}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="Previous illnesses, surgeries..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Family History</label>
              <textarea
                name="familyHistory"
                value={formData.familyHistory}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="Relevant family medical history..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Immunization Status</label>
              <textarea
                name="immunizationStatus"
                value={formData.immunizationStatus}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="List vaccines and dates..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Known Allergies</label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="Drug allergies, food allergies..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Diagnosis */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Diagnosis</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Impression</label>
            <textarea
              name="clinicalImpression"
              value={formData.clinicalImpression}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Overall clinical assessment..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provisional Diagnosis</label>
            <textarea
              name="provisionalDiagnosis"
              value={formData.provisionalDiagnosis}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Initial diagnostic impression..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Final Diagnosis</label>
            <textarea
              name="finalDiagnosis"
              value={formData.finalDiagnosis}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Confirmed diagnosis..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Differential Diagnosis</label>
            <textarea
              name="differentialDiagnosis"
              value={formData.differentialDiagnosis}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Other possible diagnoses to consider..."
            />
          </div>
        </div>
      </div>

      {/* Treatment Plan */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Treatment & Management Plan</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Plan</label>
            <textarea
              name="treatmentPlan"
              value={formData.treatmentPlan}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Overall management approach..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medications Prescribed</label>
            <textarea
              name="medications"
              value={formData.medications}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="List medications with dosage and duration..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Further Lab Investigations</label>
              <textarea
                name="labInvestigations"
                value={formData.labInvestigations}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="Additional tests required..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referrals</label>
              <textarea
                name="referrals"
                value={formData.referrals}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="Specialist referrals if needed..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Plan</label>
            <textarea
              name="followUpPlan"
              value={formData.followUpPlan}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="When to return, what to monitor..."
            />
          </div>
        </div>
      </div>

      {/* Screening Outcome */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Screening Outcome</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Overall Screening Result</label>
            <select
              name="screeningOutcome"
              value={formData.screeningOutcome}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="">Select outcome...</option>
              <option value="healthy">Healthy - No Issues Detected</option>
              <option value="minor-issues">Minor Issues - Follow-up Recommended</option>
              <option value="requires-treatment">Requires Treatment</option>
              <option value="urgent-referral">Urgent Referral Required</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
            <textarea
              name="recommendations"
              value={formData.recommendations}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Health recommendations, lifestyle advice, preventive measures..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor's Final Notes</label>
            <textarea
              name="doctorNotes"
              value={formData.doctorNotes}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Any additional notes or observations..."
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="submit"
          className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition"
        >
          Complete Screening
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