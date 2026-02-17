import { Outlet } from 'react-router-dom'
import ClinicianSidebar from './ClinicianSidebar'
import { useAuthStore } from '../../store/authStore'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ClinicianDashboard() {
  const { profile, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [user, navigate])

  if (!profile || !user) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar - responsive */}
      <ClinicianSidebar />

      {/* Main content area - responsive padding */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="p-4 lg:p-8">
          {/* Add top padding on mobile to account for hamburger button */}
          <div className="lg:mt-0 mt-12">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}