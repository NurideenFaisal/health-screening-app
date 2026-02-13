import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'

export default function AdminDashboard() {
    const { profile, user } = useAuthStore()
    const navigate = useNavigate()

    // Redirect to login when user is fully logged out (user === null)
    useEffect(() => {
        if (user === null) {
            navigate('/login', { replace: true })
        }
    }, [user, navigate])

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

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />

        </div>
    )
}