import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import SuperAdminSidebar from './SuperAdminSidebar'
import { useEffect } from 'react'

export default function SuperAdminDashboard() {
  const { profile, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect non-super-admin users away from super-admin routes
    if (profile?.role && profile?.role !== 'super-admin') {
      navigate('/', { replace: true })
    } else if (!user) {
      navigate('/login', { replace: true })
    }
  }, [user, profile, navigate])

  if (!profile || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Mission Control...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminSidebar />
      <main className="flex-1 lg:ml-0 ml-0 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
