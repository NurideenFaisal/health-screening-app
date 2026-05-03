import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Users, Building2, ClipboardCheck, Activity } from "lucide-react"
import { CardSkeleton, StatCard } from '../../components/ui/primitives'

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

        const [
          beneficiariesCount,
          activeClinicsCount,
          screeningsCount,
          adminCount,
          clinicianCount,
        ] = await Promise.all([
          supabase
            .from('children')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('clinics')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true),
          supabase
            .from('screenings')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'submitted'),
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'admin'),
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'clinician'),
        ])

        if (beneficiariesCount.error) throw beneficiariesCount.error
        if (activeClinicsCount.error) throw activeClinicsCount.error
        if (screeningsCount.error) throw screeningsCount.error
        if (adminCount.error) throw adminCount.error
        if (clinicianCount.error) throw clinicianCount.error

        setStats({
          totalBeneficiaries: beneficiariesCount.count || 0,
          activeClinics: activeClinicsCount.count || 0,
          totalScreenings: screeningsCount.count || 0,
          totalStaff: (adminCount.count || 0) + (clinicianCount.count || 0)
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
      textColor: 'text-emerald-800'
    },
    {
      label: 'Active Clinics',
      value: stats.activeClinics,
      icon: <Building2 size={28} className="text-blue-600" />,
      textColor: 'text-blue-800'
    },
    {
      label: 'Total Screenings',
      value: stats.totalScreenings,
      icon: <ClipboardCheck size={28} className="text-purple-600" />,
      textColor: 'text-purple-800'
    },
    {
      label: 'Total Staff',
      value: stats.totalStaff,
      icon: <Activity size={28} className="text-orange-600" />,
      textColor: 'text-orange-800'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <CardSkeleton rows={1} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map(index => <CardSkeleton key={index} rows={2} />)}
        </div>
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

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <StatCard key={stat.label} value={stat.value.toLocaleString()} label={stat.label} icon={stat.icon} valueClassName={stat.textColor} />
        ))}
      </div>
    </div>
  )
}
