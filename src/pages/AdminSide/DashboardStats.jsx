import React from 'react'

import { Users, UserRound, ClipboardList, Clock } from "lucide-react"
import { StatCard } from '../../components/ui/primitives'

export default function DashboardStats() {
  const stats = [
    { value: 24, label: 'Total Staff Accounts', icon: <Users size={28} className="text-[#2563EB]" /> },
    {
      value: 1284,
      label: 'People in System',
      icon: <UserRound size={28} className="text-[#8B5CF6]" />
    },
    {
      value: 856,
      label: 'Screening Forms',
      icon: <ClipboardList size={28} className="text-[#10B981]" />
    },
    {
      value: 42,
      label: 'Pending Reviews',
      icon: <Clock size={28} className="text-[#F59E0B]" />
    },
  ]



  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} value={stat.value} label={stat.label} icon={stat.icon} />
      ))}
    </div>
  )
}
