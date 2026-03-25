import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, Building2, ClipboardCheck, Activity, Loader2 } from "lucide-react"

export default function SuperAdminDashboardStats() {
  const [stats, setStats] = useState({
    totalBeneficiaries: 0,
    activeClinics: 0,
    totalScreenings: 0,
    totalStaff: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchGlobalStats() {
      try {
        setLoading(true)
        setError(null)

        // Use .count() with { head: true } for instant lightweight counts
        const [
          beneficiariesCount,
          activeClinicsCount,
          screeningsCount,
          staffCount
        ] = await Promise.all([
          // Total Beneficiaries (children table)
          supabase
            .from('children')
            .count({ head: true }),
          
          // Active Clinics
          supabase
            .from('clinics')
            .count({ head: true, filter: { is_active: true } }),
          
          // Total Screenings completed (status = 'submitted')
          supabase
            .from('screenings')
            .count({ head: true, filter: { status: 'submitted' } }),
          
          // Total Staff (profiles with role admin or clinician)
          supabase
            .from('profiles')
            .count({ head: true, filter: { role: 'admin' } })
        ])

        // Also get clinicians count
        const cliniciansCount = await supabase
          .from('profiles')
          .count({ head: true, filter: { role: 'clinician' } })

        setStats({
          totalBeneficiaries: beneficiariesCount.count || 0,
          activeClinics: activeClinicsCount.count || 0,
          totalScreenings: screeningsCount.count || 0,
          totalStaff: (staffCount.count || 0) + (cliniciansCount.count || 0)
        })
      } catch (err) {
        console.error('Error fetching global stats:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGlobalStats()
  }, [])

  const statCards = [
    {
      label: 'Total Beneficiaries',
      value: stats.totalBeneficiaries,
      icon: <Users size={28} className="text-emerald-600" />,
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-800'
    },
    {
      label: 'Active Clinics',
      value: stats.activeClinics,
      icon: <Building2 size={28} className="text-blue-600" />,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800'
    },
    {
      label: 'Total Screenings',
      value: stats.totalScreenings,
      icon: <ClipboardCheck size={28} className="text-purple-600" />,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800'
    },
    {
      label: 'Total Staff',
      value: stats.totalStaff,
      icon: <Activity size={28} className="text-orange-600" />,
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-gray-600">Loading global statistics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Error loading statistics: {error}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mission Control Dashboard</h1>
        <p className="text-gray-600">Global overview of all clinics and beneficiaries</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                {stat.icon}
              </div>
            </div>
            <div className={`text-[32px] font-bold ${stat.textColor} mb-1`}>
              {stat.value.toLocaleString()}
            </div>
            <div className="text-[14px] font-medium text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
