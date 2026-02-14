import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

export default function AdminSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, user, clearAuth } = useAuthStore()

  const [collapsed, setCollapsed] = React.useState(() => {
    const stored = localStorage.getItem('adminSidebarCollapsed')
    return stored ? JSON.parse(stored) : false
  })

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('adminSidebarCollapsed', JSON.stringify(next))
      return next
    })
  }

  const pages = [
    { name: 'Dashboard', route: '' },
    { name: 'Role Management', route: 'role-management' },
    { name: 'Patient Data', route: 'patient-data' },
    { name: 'Screening Data', route: 'screening-data' },
    { name: 'Reports', route: 'reports' }
  ]

  const isActive = (route) => {
    if (route === '') {
      return location.pathname === '/admin' || location.pathname === '/admin/'
    }

    if (route === 'screening-data') {
      return (
        location.pathname.startsWith('/admin/screening-data') ||
        location.pathname.startsWith('/admin/patient/')
      )
    }

    return location.pathname.startsWith(`/admin/${route}`)
  }

  async function handleLogout() {
    const confirmLogout = window.confirm('Are you sure you want to logout?')
    if (!confirmLogout) return

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      if (typeof clearAuth === 'function') await clearAuth()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Logout failed:', err)
      alert('Logout failed. Please try again.')
    }
  }

  return (
    <div
      className={`${collapsed ? 'w-20' : 'w-64'
        } h-screen bg-white shadow-lg flex flex-col transition-all duration-300`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="font-bold text-gray-900 text-lg">Screening</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {collapsed ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-2">
          {pages.map((page) => (
            <li key={page.name}>
              <button
                onClick={() => navigate(`/admin/${page.route}`)}
                className={`w-full flex items-center ${collapsed ? 'justify-center' : ''
                  } px-4 py-3 rounded-lg transition font-medium
                  ${isActive(page.route)
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
              >
                {!collapsed && <span>{page.name}</span>}
                {collapsed && <span>{page.name[0]}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-gray-200">
        <div
          className={`flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-50 ${collapsed ? 'justify-center' : ''
            }`}
        >
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center font-semibold text-emerald-700">
            {profile?.full_name
              ? profile.full_name[0].toUpperCase()
              : 'U'}
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

        <button
          onClick={handleLogout}
          title="Logout"
          className={`mt-3 w-full flex items-center ${collapsed ? 'justify-center' : ''
            } px-3 py-2 rounded-lg text-sm font-medium transition bg-gray-100 hover:bg-red-500 hover:text-white`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V5"
            />
          </svg>

          {!collapsed && <span className="ml-2">Logout</span>}
        </button>

      </div>
    </div>
  )
}
