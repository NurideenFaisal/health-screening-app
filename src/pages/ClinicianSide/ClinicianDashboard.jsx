import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import ClinicianSidebar from './ClinicianSidebar'
import { PageLoader } from '../../components/ui/primitives'

export default function ClinicianDashboard() {
  const { profile, user } = useAuthStore()

  if (!profile || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 sm:p-6">
        <PageLoader />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <ClinicianSidebar />
      <div className="flex-1 overflow-y-auto min-w-0 pb-16 lg:pb-0">
        <div className="mt-14 p-4 sm:p-6 lg:mt-0">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
