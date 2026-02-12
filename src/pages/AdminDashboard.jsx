import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { loadSession } from '../lib/loadSession'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
    const { profile, user, clearAuth } = useAuthStore()
    const navigate = useNavigate()

    // Load session on mount if missing
    useEffect(() => {
        if (!user && typeof loadSession === 'function') {
            loadSession()
        }
    }, [user, loadSession])

    // Redirect to login when user is fully logged out (user === null)
    useEffect(() => {
        if (user === null) {
            navigate('/login', { replace: true })
        }
    }, [user, navigate])

    async function handleLogout() {
        const confirmLogout = window.confirm('Are you sure you want to logout?')
        if (!confirmLogout) return

        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error

            // clear local store
            if (typeof clearAuth === 'function') {
                clearAuth()
            }

            // ensure redirect
            navigate('/login', { replace: true })
        } catch (err) {
            console.error('Logout failed:', err)
            alert('Logout failed. Please try again.')
        }
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

    // ✅ Admin sidebar — your updated names
    const links = [
        'Dashboard',
        'Role Management',
        'Patient Data',
        'Screening Information',
        'Reports',
    ]

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
                            <p className="text-xs text-gray-500">Admin</p>
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
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm
                            hover:bg-gray-100 hover:text-white transition-colors duration-200">
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome back, {profile.full_name || user.email}!
                    </h1>
                    <p className="text-gray-600">
                        Manage your health screening system
                    </p>

                    {profile.centre && (
                        <p className="text-sm text-emerald-600 mt-1">
                            {profile.centre.name} ({profile.centre.code})
                        </p>
                    )}
                </div>

                {/* keep your stats + quick actions exactly as before */}

            </div>
        </div>
    )
}