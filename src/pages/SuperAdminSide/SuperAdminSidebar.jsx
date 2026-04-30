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
  Rocket,
  FileText,
  Layout,
  ClipboardList
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
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false)

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('superAdminSidebarCollapsed', JSON.stringify(next))
      return next
    })
  }

  const pages = [
    { name: 'Dashboard', route: 'dashboard', icon: LayoutDashboard },
    { name: 'Form Builder', route: 'form-builder', icon: Layout },
    { name: 'Templates', route: 'templates', icon: FileText },
    { name: 'User Management', route: 'users', icon: Users },
    { name: 'Clinic Registry', route: 'clinics', icon: Building2 },
    { name: 'Launch Clinic', route: 'launch-clinic', icon: Rocket },
  ]

  const isActive = (route) => {
    if (route === 'dashboard') {
      return location.pathname === '/super-admin/dashboard' || location.pathname === '/super-admin'
    }
    return location.pathname.startsWith(`/super-admin/${route}`)
  }

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

  // Render navigation items
  const renderNavItems = (isMobile = false) => (
    <ul className="space-y-2">
      {pages.map((page) => {
        const Icon = page.icon
        const active = isActive(page.route)

        return (
          <li key={page.name}>
            <button
              onClick={() => {
                navigate(`/super-admin/${page.route}`)
                if (isMobile) setMobileOpen(false)
              }}
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

              {(!collapsed || isMobile) && (
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

  // Render user section
  const renderUserSection = (isMobile = false) => (
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
          ${(collapsed && !isMobile) ? 'justify-center' : 'gap-3'}
        `}
      >
        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0">
          {profile?.full_name
            ? profile.full_name.charAt(0).toUpperCase()
            : 'S'}
        </div>

        {(!collapsed || isMobile) && (
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
        onClick={() => setShowLogoutConfirm(true)}
        className="mt-3 w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition bg-emerald-800 hover:bg-red-600 hover:text-white min-w-0"
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

  // Render sidebar content
  const renderSidebar = (isMobile = false) => (
    <div
      className={`
        ${!isMobile && collapsed ? 'w-20' : 'w-64'}
        h-screen
        bg-emerald-900
        shadow-xl
        flex
        flex-col
        ${isMobile ? '' : 'transition-all duration-300'}
        overflow-y-auto
        overflow-x-hidden
      `}
    >
      {/* ================= HEADER ================= */}
      <div className="p-4 border-b border-emerald-700 flex items-center justify-between min-w-0">
        {(!collapsed || isMobile) && (
          <div className="min-w-0">
            <h1 className="font-bold text-white text-lg truncate">
              Mission Control
            </h1>
            <p className="text-xs text-emerald-300 truncate">
              Super Admin
            </p>
          </div>
        )}

        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-emerald-700 transition text-emerald-100"
          >
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}

        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-emerald-700 transition text-emerald-100"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {/* ================= NAVIGATION ================= */}
      <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
        {renderNavItems(isMobile)}
      </nav>

      {/* ================= USER SECTION ================= */}
      {renderUserSection(isMobile)}
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
        {renderSidebar(false)}
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
        will-change-transform
      `}>
        {renderSidebar(true)}
      </div>

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
