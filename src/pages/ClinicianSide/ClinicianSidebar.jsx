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
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false)

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
    { name: 'Dashboard', route: 'dashboard', icon: LayoutDashboard },
    { name: 'Screening Data', route: 'screening-data', icon: ClipboardList },
    { name: 'Patient Data', route: 'patient-data', icon: Users },
  ]

  // Active route helper
  const isActive = (route) => {
    if (route === 'dashboard') {
      return location.pathname === '/clinician' || location.pathname === '/clinician/' || location.pathname === '/clinician/dashboard'
    }
    if (route === 'screening-data') {
      return location.pathname.startsWith('/clinician/screening-data') ||
        location.pathname.startsWith('/clinician/patient/')
    }
    return location.pathname.startsWith(`/clinician/${route}`)
  }

  // Logout handler
  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      clearAuth()
      navigate('/login')
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
        onClick={() => setShowLogoutConfirm(true)}
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

      {/* ================= MOBILE BOTTOM TAB BAR ================= */}

      {/* ================= MOBILE BOTTOM DOCK ================= */}
      {/* ================= MOBILE BOTTOM NAV ================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 pb-safe-area-bottom">
        <div className="flex items-stretch h-16">

          {/* 1. Home */}
          <button
            onClick={() => navigate('/clinician/dashboard')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${isActive('dashboard') ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-400'}`}
          >
            <LayoutDashboard size={20} strokeWidth={isActive('dashboard') ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Home</span>
          </button>

          {/* 3. Screening (Now "Normal") */}
          <button
            onClick={() => navigate('/clinician/screening-data')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${isActive('screening-data') ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-400'}`}
          >
            <ClipboardList size={20} strokeWidth={isActive('screening-data') ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Screen</span>
          </button>

          {/* 2. Patients */}
          <button
            onClick={() => navigate('/clinician/patient-data')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${isActive('patient-data') ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-400'}`}
          >
            <Users size={20} strokeWidth={isActive('patient-data') ? 2.5 : 2} />
            <span className="text-[10px] font-bold">Patients</span>
          </button>

          

          {/* 4. Account & Exit */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-slate-400 active:bg-red-50 active:text-red-600 transition-all border-l border-slate-100"
          >
            <div className="flex flex-col items-center">
              <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[8px] font-black text-slate-600 mb-0.5">
                {profile?.full_name?.charAt(0)}
              </div>
              <span className="text-[10px] font-bold leading-none">
                {profile?.full_name?.split(' ')[0] || 'Exit'}
              </span>
            </div>
          </button>

        </div>
      </div>



      {/* ================= DESKTOP SIDEBAR ================= */}
      < div
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
        < div className="p-4 border-b border-gray-200 flex items-center justify-between min-w-0" >
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 text-lg truncate">
                {profile?.clinic_name || 'Screening'}
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
        </div >

        {/* Desktop Navigation */}
        < nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden" >
          {renderNavItems(false)}
        </nav >

        {/* Desktop User Section */}
        {renderUserSection(false)}
      </div >

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900">Confirm Logout</h2>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to log out?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleLogout()
                  setShowLogoutConfirm(false)
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 
