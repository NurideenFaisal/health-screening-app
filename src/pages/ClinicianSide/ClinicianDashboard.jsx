import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import ClinicianSidebar from './ClinicianSidebar'

export default function ClinicianDashboard() {
  const { profile, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user === null) {
      navigate('/login', { replace: true })
    }
  }, [user, navigate])

  if (!profile || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <ClinicianSidebar />

      {/* Main content — Outlet renders the active child route */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="p-4 lg:p-8 mt-12 lg:mt-0">
          <Outlet />
        </div>
      </div>

    </div>
  )
} 