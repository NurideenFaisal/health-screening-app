import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ScreeningForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile, user } = useAuthStore()

  // Demo patients data
  const patients = [
    { id: 'GH0987-001', name: 'Kwame Mensah', gender: 'Male', age: 6 },
    { id: 'GH0987-002', name: 'Ama Asante', gender: 'Female', age: 5 },
    { id: 'GH0987-003', name: 'Kofi Owusu', gender: 'Male', age: 4 },
    { id: 'GH0987-004', name: 'Akua Boateng', gender: 'Female', age: 7 },
    { id: 'GH0987-005', name: 'Yaw Osei', gender: 'Male', age: 6 },
  ]

  const patient = patients.find(p => p.id === id)

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Patient not found</p>
          <button 
            onClick={() => navigate('/clinician/screen-form')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Health Screening Form</h1>
            <p className="text-gray-600 mt-1">Clinician: {profile?.full_name}</p>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            ← Back
          </button>
        </div>

        {/* Patient Info Card */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6 border-l-4 border-emerald-500">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Name</p>
              <p className="font-semibold text-gray-900">{patient.name}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">ID</p>
              <p className="font-semibold text-gray-900">{patient.id}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Gender</p>
              <p className="font-semibold text-gray-900">{patient.gender}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Age</p>
              <p className="font-semibold text-gray-900">{patient.age} years</p>
            </div>
          </div>
        </div>

        {/* Screening Form */}
        <div className="bg-white rounded-2xl shadow p-8 space-y-6">
          <form onSubmit={(e) => { e.preventDefault(); alert('Screening saved!') }}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Height (cm)</label>
                <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g., 120" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Weight (kg)</label>
                <input type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g., 25" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Pressure</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g., 120/80" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Temperature (°C)</label>
                <input type="number" step="0.1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g., 37.0" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Clinical Notes</label>
              <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" rows="4" placeholder="Add any clinical observations..."></textarea>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition">
                Save Screening
              </button>
              <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
