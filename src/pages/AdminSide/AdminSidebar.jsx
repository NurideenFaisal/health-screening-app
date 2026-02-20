import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  Calendar,
  Shield,
  LogOut,
  Menu,
  ChevronLeft
} from "lucide-react"

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
    { name: 'Dashboard', route: '', icon: LayoutDashboard },
    { name: 'Role Management', route: 'role-management', icon: Shield },
    { name: "Cycle Manager", route: 'cycle-manager', icon: Calendar },
    { name: 'Patient Data', route: 'patient-data', icon: Users },
    // { name: 'Screening Data', route: 'screening-data', icon: ClipboardList },
    // { name: 'Reports', route: 'reports', icon: FileText }
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
      clearAuth()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Logout failed:', err)
      alert('Logout failed. Please try again.')
    }
  }

  return (
    <div
      className={`
        ${collapsed ? 'w-20' : 'w-64'}
        h-screen
        bg-white
        shadow-lg
        flex
        flex-col
        transition-all
        duration-300
        overflow-y-auto
        overflow-x-hidden
      `}
    >
      {/* ================= HEADER ================= */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between min-w-0">
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 text-lg truncate">
              Screening
            </h1>
            <p className="text-xs text-gray-500 truncate">
              Admin Panel
            </p>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* ================= NAVIGATION ================= */}
      <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-2">
          {pages.map((page) => {
            const Icon = page.icon
            const active = isActive(page.route)

            return (
              <li key={page.name}>
                <button
                  onClick={() => navigate(`/admin/${page.route}`)}
                  className={`
                    w-full
                    flex
                    items-center
                    px-4
                    py-3
                    rounded-lg
                    transition
                    font-medium
                    min-w-0
                    ${active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
                    }
                  `}
                >
                  <div className="w-6 flex justify-center flex-shrink-0">
                    <Icon size={20} />
                  </div>

                  {!collapsed && (
                    <span className="ml-3 truncate">
                      {page.name}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ================= USER SECTION ================= */}
      <div className="p-3 border-t border-gray-200 overflow-x-hidden">
        <div
          className={`
            flex
            items-center
            px-3
            py-3
            rounded-lg
            bg-gray-50
            min-w-0
            ${collapsed ? 'justify-center' : 'gap-3'}
          `}
        >
          <div className="w-10 h-10 bg-emerald-400 rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0">
            {profile?.full_name
              ? profile.full_name.charAt(0).toUpperCase()
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

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-3 w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition bg-gray-100 hover:bg-red-500 hover:text-white min-w-0"
        >
          <div className="w-6 flex justify-center flex-shrink-0">
            <LogOut size={20} />
          </div>

          {!collapsed && (
            <span className="ml-3 truncate">
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
