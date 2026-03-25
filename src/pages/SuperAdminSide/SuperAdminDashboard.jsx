import React from 'react'
import { Outlet } from 'react-router-dom'
import SuperAdminSidebar from './SuperAdminSidebar'

export default function SuperAdminDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminSidebar />
      <main className="flex-1 lg:ml-0 ml-0 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
