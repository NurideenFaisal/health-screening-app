import React from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import SuperAdminSidebar from './SuperAdminSidebar'
import { PageLoader } from '../../components/ui/primitives'

export default function SuperAdminDashboard() {
  const { profile, user } = useAuthStore()

  if (!profile || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 sm:p-6">
        <PageLoader />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SuperAdminSidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  )
}
