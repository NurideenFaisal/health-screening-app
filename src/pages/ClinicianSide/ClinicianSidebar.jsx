import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { LayoutDashboard, Users, ClipboardList, LogOut, Menu, X, ChevronLeft } from "lucide-react"

export default function ClinicianSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, user, clearAuth } = useAuthStore()

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  // Desktop collapsed state (persistent in localStorage)
  const [collapsed, setCollapsed] = React.useState(() => {
    const stored = localStorage.getItem('clinicianSidebarCollapsed')
    return stored ? JSON.parse(stored) : false
  })

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('clinicianSidebarCollapsed', JSON.stringify(next))
      return next
    })
  }

  // Close mobile menu on route change
  React.useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Prevent body scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  // Clinician pages
  const pages = [
    { name: 'Dashboard', route: '', icon: LayoutDashboard },
    { name: 'Patient Data', route: 'patient-data', icon: Users },
    { name: 'Screening Data', route: 'screening-data', icon: ClipboardList }
  ]

  // Active route helper
  const isActive = (route) => {
    if (route === '') return location.pathname === '/clinician' || location.pathname === '/clinician/'
    if (route === 'screening-data') {
      return location.pathname.startsWith('/clinician/screening-data') ||
             location.pathname.startsWith('/clinician/patient/')
    }
    return location.pathname.startsWith(`/clinician/${route}`)
  }

  // Logout handler
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

  // Render navigation items (shared between mobile and desktop)
  const renderNavItems = (isMobile = false) => (
    <ul className="space-y-2">
      {pages.map((page) => {
        const Icon = page.icon
        const active = isActive(page.route)

        return (
          <li key={page.name}>
            <button
              onClick={() => navigate(`/clinician/${page.route}`)}
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

              {(isMobile || !collapsed) && (
                <span className="ml-3 truncate">
                  {page.name}
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )

  // Render user section (shared between mobile and desktop)
  const renderUserSection = (isMobile = false) => (
    <div className="p-3 border-t border-gray-200 overflow-x-hidden">
      <div className={`
        flex
        items-center
        px-3
        py-3
        rounded-lg
        bg-gray-50
        min-w-0
        ${(collapsed && !isMobile) ? 'justify-center' : 'gap-3'}
      `}>
        <div className="w-10 h-10 bg-emerald-400 rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0">
          {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
        </div>

        {(!collapsed || isMobile) && (
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

        {(!collapsed || isMobile) && (
          <span className="ml-3 truncate">
            Logout
          </span>
        )}
      </button>
    </div>
  )

  return (
    <>
      {/* ================= MOBILE HAMBURGER BUTTON ================= */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition"
        aria-label="Open menu"
      >
        <Menu size={24} className="text-gray-700" />
      </button>

      {/* ================= MOBILE MENU OVERLAY ================= */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ================= MOBILE SIDEBAR ================= */}
      <div
        className={`
          lg:hidden
          fixed
          top-0
          left-0
          h-screen
          w-72
          bg-white
          shadow-2xl
          flex
          flex-col
          transition-transform
          duration-300
          z-50
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900 text-lg">
              Screening
            </h1>
            <p className="text-xs text-gray-500">
              Clinician Panel
            </p>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {renderNavItems(true)}
        </nav>

        {/* Mobile User Section */}
        {renderUserSection(true)}
      </div>

      {/* ================= DESKTOP SIDEBAR ================= */}
      <div
        className={`
          hidden
          lg:flex
          ${collapsed ? 'w-20' : 'w-64'}
          h-screen
          bg-white
          shadow-lg
          flex-col
          transition-all
          duration-300
          overflow-y-auto
          overflow-x-hidden
        `}
      >
        {/* Desktop Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between min-w-0">
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 text-lg truncate">
                Screening
              </h1>
              <p className="text-xs text-gray-500 truncate">
                Clinician Panel
              </p>
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
          {renderNavItems(false)}
        </nav>

        {/* Desktop User Section */}
        {renderUserSection(false)}
      </div>
    </>
  )
} 