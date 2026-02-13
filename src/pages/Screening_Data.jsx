import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Screening_data() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const patients = [
    { id: 'GH0987-001', name: 'Kwame Mensah', gender: 'Male', age: 6 },
    { id: 'GH0987-002', name: 'Ama Asante', gender: 'Female', age: 5 },
    { id: 'GH0987-003', name: 'Kofi Owusu', gender: 'Male', age: 4 },
    { id: 'GH0987-004', name: 'Akua Boateng', gender: 'Female', age: 7 },
    { id: 'GH0987-005', name: 'Yaw Osei', gender: 'Male', age: 6 },
  ]

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.id.toLowerCase().includes(query.toLowerCase())
  )

  function initials(name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="w-full space-y-8">

      {/* SEARCH CARD */}
      <div className="bg-white rounded-2xl shadow p-7 space-y-6">

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center shadow">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.3-4.3m1.3-5.2A7 7 0 1110 3a7 7 0 018 8z" />
            </svg>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Find Patient</h2>
            <p className="text-gray-500 text-sm">
              Search by name or ID to begin screening
            </p>
          </div>
        </div>

        <div className="relative">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by patient name or ID..."
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 
                       focus:ring-2 focus:ring-emerald-500 focus:outline-none text-gray-700"
          />

          <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4.5"
            fill="none" stroke="currentColor" viewBox="0 0 20 20">
            <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-4.3-4.3m1.3-5.2A7 7 0 1110 3a7 7 0 018 8z" />
          </svg>
        </div>

      </div>

      {/* RESULTS */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-4">

        <h3 className="text-lg font-semibold text-gray-800">
          {filtered.length} Patients Found
        </h3>

        {filtered.map(p => (
          <div
            key={p.id}
            onClick={() => navigate(`/admin/patient/${p.id}`)}

            className="flex items-center justify-between p-5 rounded-xl border
                       border-gray-200 hover:border-emerald-400 hover:shadow-sm
                       transition cursor-pointer"
          >
            <div className="flex items-center gap-4">

              <div className="w-14 h-14 rounded-xl bg-emerald-500 text-white
                              flex items-center justify-center font-bold text-lg">
                {initials(p.name)}
              </div>

              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  {p.name}
                </p>
          
                <p className="text-sm text-gray-500">
                  ID: {p.id} • {p.gender} • {p.age} years old
                </p>
              </div>
            </div>

            <svg className="w-6 h-6 text-emerald-600"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No patients match your search
          </div>
        )}

      </div>

    </div>
  )
}
