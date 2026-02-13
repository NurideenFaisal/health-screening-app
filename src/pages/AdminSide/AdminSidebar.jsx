import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'



export default function AdminSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, user, clearAuth } = useAuthStore()

  // Sidebar collapsed state persisted in localStorage
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

  // Sidebar navigation items
  // Define intuitive icons inline
  const pages = [
    {
      name: 'Dashboard',
      route: '',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M3 13h8V3H3v10zm10 8h8v-6h-8v6zM3 21h8v-6H3v6zm10-8h8V3h-8v10z" />
        </svg>)
    },
    {
      name: 'Role Management',
      route: 'role-management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 
        1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 
        1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      )
    },
    {
      name: 'Patient Data',
      route: 'patient-data',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" /> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6M9 11h6M9 15h4" /> </svg>
      )
    },
    {
      name: 'Screening Data',
      route: 'screening-data',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M6 4v6a4 4 0 008 0V4M10 14v6m4-6v6m-4 0h4" />
        </svg>

      )
    },
    {
      name: 'Reports',
      route: 'reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3v9h9a9 9 0 11-9-9z" /> </svg>
      )
    }
  ]


  // Highlight the active page
  const isActive = (route) => {
    // Dashboard
    if (route === '') return location.pathname === '/admin' || location.pathname === '/admin/'

    // Screening Data: also active on patient/:id
    if (route === 'screening-data') {
      return (
        location.pathname.startsWith('/admin/screening-data') ||
        location.pathname.startsWith('/admin/patient/')
      )
    }

    // Other pages
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
    <div className={`${collapsed ? 'w-20' : 'w-64'} bg-white shadow-lg flex flex-col transition-all duration-300`}>

      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="font-bold text-gray-900 text-lg">Health Screening</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        )}

        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-100 transition"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-2">
          {pages.map((page) => (
            <li key={page.name}>
              <button
                onClick={() => navigate(`/admin/${page.route}`)}
                title={collapsed ? page.name : ''}
                className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-4 py-3 rounded-lg
        transition font-medium
        ${isActive(page.route)
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'}`}
              >
                {page.icon}
                {!collapsed && <span className="ml-3">{page.name}</span>}
              </button>
            </li>
          ))}

        </ul>
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-gray-200">
        <div className={`flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-50 ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? profile?.full_name : ''}>
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center font-semibold text-emerald-700">
            {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>

        <button onClick={handleLogout} title="Logout"
          className={`mt-3 w-full flex items-center ${collapsed ? 'justify-center' : ''} px-3 py-2 rounded-lg text-sm font-medium transition bg-gray-100 hover:bg-red-500 hover:text-white`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V5" />
          </svg>
          {!collapsed && <span className="ml-2">Logout</span>}
        </button>
      </div>

    </div>
  )
}
