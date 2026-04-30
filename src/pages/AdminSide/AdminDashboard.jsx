import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import { useAuthStore } from '../../store/authStore'

export default function AdminDashboard() {
  const { profile, user } = useAuthStore()

  if (!profile || !user) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 p-8 overflow-y-auto min-w-0">
        <Outlet />
      </div>
    </div>
  )
}