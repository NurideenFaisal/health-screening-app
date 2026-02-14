import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import { useAuthStore } from '../../store/authStore'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
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
      <AdminSidebar />

      {/* IMPORTANT: min-w-0 prevents flex reflow jumping */}
      <div className="flex-1 p-8 overflow-y-auto min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
