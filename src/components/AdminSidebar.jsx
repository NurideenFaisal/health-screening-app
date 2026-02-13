import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

import Screening_data from '../pages/Screening_Data'

export default function AdminSidebar() {
  const navigate = useNavigate()
  const { profile, user, clearAuth } = useAuthStore()

  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [collapsed, setCollapsed] = React.useState(false)

// Import your page components
// import ScreeningForm from '../pages/screeningForm/ScreeningForm'
// import RoleManagement from '../pages/roleManagement/RoleManagement'
// import PatientData from '../pages/patientData/PatientData'
// import ScreeningData from '../pages/screeningData/ScreeningData'
// import Reports from '../pages/reports/Reports'

// Pages (keep placeholders or replace with real components later)
  const pages = [
    { name: 'Dashboard', component: <div className="p-8">Welcome to the Dashboard</div> },
    { name: 'Role Management', component: <div className="p-8">Role Management Page</div> },
    { name: 'Patient Data', component: <div className="p-8">Patient Data Page</div> },
    { name: 'Screening Data', component:  <Screening_data /> },
    { name: 'Reports', component: <div className="p-8">Reports Page</div> },
  ]

  async function handleLogout() {
    const confirmLogout = window.confirm('Are you sure you want to logout?')
    if (!confirmLogout) return

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      if (typeof clearAuth === 'function') {
        const res = clearAuth()
        if (res instanceof Promise) await res
      }

      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Logout failed:', err)
      alert('Logout failed. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* SIDEBAR */}
      <div className={`${collapsed ? 'w-20' : 'w-64'} bg-white shadow-lg flex flex-col transition-all duration-300`}>

        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!collapsed && (
            <div>
              <h1 className="font-bold text-gray-900 text-lg">Health Screening</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 19l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3">
          <ul className="space-y-2">
            {pages.map((page, idx) => (
              <li key={page.name}>
                <button
                  onClick={() => setCurrentIndex(idx)}
                  title={collapsed ? page.name : ''}
                  className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-4 py-3 rounded-lg
                  transition font-medium
                  ${currentIndex === idx
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'}`}
                >
                  {/* icon */}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6M9 8h6M5 4h14v16H5z" />
                  </svg>

                  {!collapsed && (
                    <span className="ml-3">{page.name}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-gray-200">

          {/* User */}
          <div
            className={`flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-50 
            ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? profile?.full_name : ''}
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center font-semibold text-emerald-700">
              {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Logout"
            className={`mt-3 w-full flex items-center ${collapsed ? 'justify-center' : ''}
            px-3 py-2 rounded-lg text-sm font-medium transition
            bg-gray-100 hover:bg-red-500 hover:text-white`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V5" />
            </svg>

            {!collapsed && <span className="ml-2">Logout</span>}
          </button>

        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8">
        {pages[currentIndex].component}
      </div>

    </div>
  )
}