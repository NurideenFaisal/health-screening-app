import React from 'react'

import { Users, UserRound, FileText, ClipboardList, Clock } from "lucide-react"

export default function ClinicianDashboardStats() {
  const stats = [
    {
      value: 24,
      label: 'Total Staff Accounts',
      color: '#2563EB',
      icon: <Users size={28} className="text-[#2563EB]" />
    },
    {
      value: 1284,
      label: 'People in System',
      color: '#8B5CF6',
      icon: <UserRound size={28} className="text-[#8B5CF6]" />
    },
    {
      value: 856,
      label: 'Screening Forms',
      color: '#10B981',
      icon: <ClipboardList size={28} className="text-[#10B981]" />
    },
    {
      value: 42,
      label: 'Pending Reviews',
      color: '#F59E0B',
      icon: <Clock size={28} className="text-[#F59E0B]" />
    },
  ]



  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg bg-opacity-10 flex items-center justify-center`} style={{ backgroundColor: stat.color + '1A' }}>
              {stat.icon}
            </div>
          </div>
          <div className="text-[32px] font-bold text-[#0F172A] mb-1">{stat.value}</div>
          <div className="text-[14px] font-medium text-[#64748B]">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
