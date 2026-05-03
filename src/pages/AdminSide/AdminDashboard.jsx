import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import { useAuthStore } from '../../store/authStore'
import { PageLoader } from '../../components/ui/primitives'

export default function AdminDashboard() {
  const { profile, user } = useAuthStore()

  if (!profile || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4 sm:p-6">
        <PageLoader />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <AdminSidebar />
      <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <Outlet />
      </div>
    </div>
  )
}
