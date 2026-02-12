import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { profile, user } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    
    const confirmLogout = window.confirm('Are you sure you want to logout?')
    if (!confirmLogout) return

    await supabase.auth.signOut()   // server logout
    reset()                         // clear store
    navigate('/login', { replace: true }) // secure navigation
  }

  if (!profile || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Sidebar links based on role from database
  const links = profile.role === 'admin'
    ? ['Dashboard', 'Manage Users', 'Reports', 'Settings']
    : ['Dashboard', 'Child Search', 'My Screenings', 'Profile']

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg min-h-screen flex flex-col">
        
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Health Screening</h1>
              <p className="text-xs text-gray-500">{profile.role === 'admin' ? 'Admin' : 'Clinician'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link}>
                <button className="w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-medium">
                  {link}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-700 font-semibold">
                {profile.full_name ? profile.full_name[0].toUpperCase() : 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {profile.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile.full_name || user.email}!
          </h1>
          <p className="text-gray-600">
            {profile.role === 'admin' 
              ? 'Manage your health screening system' 
              : 'Manage child health screenings'}
          </p>
          {profile.centre && (
            <p className="text-sm text-emerald-600 mt-1">
              📍 {profile.centre.name} ({profile.centre.code})
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-500 text-sm">Total Children</p>
            <p className="text-3xl font-bold text-gray-900">—</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-500 text-sm">Screenings Today</p>
            <p className="text-3xl font-bold text-gray-900">—</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <p className="text-gray-500 text-sm">Pending Reviews</p>
            <p className="text-3xl font-bold text-gray-900">—</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">New Screening</p>
                  <p className="text-sm text-gray-500">Start a new child screening</p>
                </div>
              </div>
            </button>

            <button className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Search Children</p>
                  <p className="text-sm text-gray-500">Find existing records</p>
                </div>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}