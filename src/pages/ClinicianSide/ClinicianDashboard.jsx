import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import ClinicianSidebar from './ClinicianSidebar'

export default function ClinicianDashboard() {
  const { profile, user } = useAuthStore()

  if (!profile || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <ClinicianSidebar />
      <div className="flex-1 overflow-y-auto min-w-0 pb-16 lg:pb-0">
        <div className="mt-14 px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-5 lg:mt-0 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}