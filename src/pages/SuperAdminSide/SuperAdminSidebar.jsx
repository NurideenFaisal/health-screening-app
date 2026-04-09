import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import {
  LayoutDashboard,
  Building2,
  Users,
  LogOut,
  Menu,
  ChevronLeft,
  Rocket
} from "lucide-react"

export default function SuperAdminSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, user, clearAuth } = useAuthStore()

  const [collapsed, setCollapsed] = React.useState(() => {
    const stored = localStorage.getItem('superAdminSidebarCollapsed')
    return stored ? JSON.parse(stored) : false
  })

  const [mobileOpen, setMobileOpen] = React.useState(false)

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('superAdminSidebarCollapsed', JSON.stringify(next))
      return next
    })
  }

  const pages = [
    { name: 'Dashboard', route: 'dashboard', icon: LayoutDashboard },
    { name: 'Clinic Registry', route: 'clinics', icon: Building2 },
    { name: 'User Management', route: 'users', icon: Users },
    { name: 'Launch Clinic', route: 'launch-clinic', icon: Rocket },
  ]

  const isActive = (route) => {
    if (route === 'dashboard') {
      return location.pathname === '/super-admin/dashboard' || location.pathname === '/super-admin'
    }
    return location.pathname.startsWith(`/super-admin/${route}`)
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

  const sidebarContent = (
    <div
      className={`
        ${collapsed ? 'w-20' : 'w-64'}
        h-screen
        bg-gradient-to-b from-emerald-900 to-emerald-800
        shadow-xl
        flex
        flex-col
        transition-all
        duration-300
        overflow-y-auto
        overflow-x-hidden
      `}
    >
      {/* ================= HEADER ================= */}
      <div className="p-4 border-b border-emerald-700 flex items-center justify-between min-w-0">
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="font-bold text-white text-lg truncate">
              Mission Control
            </h1>
            <p className="text-xs text-emerald-300 truncate">
              Super Admin
            </p>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-emerald-700 transition text-emerald-100"
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
                  onClick={() => navigate(`/super-admin/${page.route}`)}
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
                      ? 'bg-white text-emerald-800 shadow-lg'
                      : 'text-emerald-100 hover:bg-emerald-700 hover:text-white'
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
      <div className="p-3 border-t border-emerald-700 overflow-x-hidden">
        <div
          className={`
            flex
            items-center
            px-3
            py-3
            rounded-lg
            bg-emerald-800/50
            min-w-0
            ${collapsed ? 'justify-center' : 'gap-3'}
          `}
        >
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0">
            {profile?.full_name
              ? profile.full_name.charAt(0).toUpperCase()
              : 'S'}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {profile?.full_name || 'Super Admin'}
              </p>
              <p className="text-xs text-emerald-300 truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-3 w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition bg-emerald-800 hover:bg-red-600 hover:text-white min-w-0"
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

  return (
    <>
      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-emerald-600 text-white rounded-lg shadow-lg"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - desktop */}
      <div className="hidden lg:block">
        {sidebarContent}
      </div>

      {/* Sidebar - mobile */}
      <div className={`
        lg:hidden 
        fixed 
        inset-y-0 
        left-0 
        z-50 
        transform 
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        transition-transform 
        duration-300
      `}>
        {sidebarContent}
      </div>
    </>
  )
}
