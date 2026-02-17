import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Screening_data() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const SIZE = {
    containerSpacing: "space-y-5",
    cardPadding: "p-4",
    innerPadding: "p-4",
    avatar: "w-9 h-9",
    headerIcon: "w-9 h-9",
    title: "text-lg",
    subtitle: "text-xs",
    name: "text-sm",
    meta: "text-xs"
  }


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
    return name[0].toUpperCase()
  }

  return (
    <div className={`w-full ${SIZE.containerSpacing}`}>

      {/* SEARCH CARD */}
      <div className={`bg-white rounded-xl shadow ${SIZE.cardPadding} space-y-5`}>

        <div className="flex items-center gap-3">
          <div className={`${SIZE.headerIcon} bg-emerald-500 rounded-lg flex items-center justify-center`}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.3-4.3m1.3-5.2A7 7 0 1110 3a7 7 0 018 8z" />
            </svg>
          </div>

          <div>
            <h2 className={`${SIZE.title} font-bold text-gray-900`}>
              Find Patient
            </h2>
            <p className={`text-gray-500 ${SIZE.subtitle}`}>
              Search by name or ID
            </p>
          </div>
        </div>

        <div className="relative">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search patient..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 
                       focus:ring-2 focus:ring-emerald-500 focus:outline-none text-gray-700"
          />

          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3.5"
            fill="none" stroke="currentColor" viewBox="0 0 20 20">
            <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-4.3-4.3m1.3-5.2A7 7 0 1110 3a7 7 0 018 8z" />
          </svg>
        </div>

      </div>

      {/* RESULTS */}
      <div className={`bg-white rounded-xl shadow ${SIZE.innerPadding} space-y-3`}>

        <h3 className="text-sm font-semibold text-gray-700">
          {filtered.length} Patients
        </h3>

        {filtered.map(p => (
          <div
            key={p.id}
            onClick={() => navigate(`/admin/patient/${p.id}`)}
            className="flex items-center justify-between p-3 rounded-lg border
                       border-gray-200 hover:border-emerald-400
                       transition cursor-pointer"
          >
            <div className="flex items-center gap-3">

              <div
                className={`${SIZE.avatar} rounded-lg 
              ${p.gender === 'Male' ? 'bg-blue-400' : p.gender === 'Female' ? 'bg-pink-400' : 'bg-gray-400'} 
              text-white flex items-center justify-center font-semibold`}
              >
                {initials(p.name)}
              </div>


              <div>
                <p className={`font-semibold text-gray-900 ${SIZE.name}`}>
                  {p.name}
                </p>

                <p className={`text-gray-500 ${SIZE.meta}`}>
                  {p.id} • {p.gender} • {p.age} yrs
                </p>
              </div>
            </div>

            <svg className="w-4 h-4 text-emerald-600"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-6 text-sm">
            No patients match your search
          </div>
        )}

      </div>

    </div>
  )
}
