import { Navigate } from 'react-router-dom'
import { ShieldAlert, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Button, PageLoader } from './ui/primitives'

export default function RoleRoute({ requiredRole, user, profile, children }) {
  const loading = useAuthStore(state => state.loading)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 sm:p-6">
        <PageLoader />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  // Convert to array if single role
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

  // Check if user is trying to access super-admin route
  const isSuperAdminRoute = window.location.pathname.startsWith('/super-admin')
  
  // Super-admin can ONLY access super-admin routes
  if (profile.role === 'super-admin') {
    if (isSuperAdminRoute) {
      return children
    }
    // Super-admin trying to access admin or clinician routes - BLOCK
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-100">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            Super Administrators cannot access individual clinic admin panels.\nPlease use the Mission Control dashboard instead.
          </p>
          <Button
            as="a"
            href="/super-admin/dashboard" 
            variant="primary"
            className="mt-6"
          >
            Go to Mission Control
          </Button>
        </div>
      </div>
    )
  }
  
  // Block non-super-admin users from accessing super-admin routes
  if (isSuperAdminRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-100">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            This area is restricted to Super Administrators only. You don't have permission to access this resource.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <AlertTriangle className="w-4 h-4" />
            <span>Your role: {profile.role}</span>
          </div>
          <Button
            as="a"
            href={profile.role === 'admin' ? '/admin/dashboard' : '/clinician/dashboard'} 
            variant="primary"
            className="mt-6"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Role doesn't match
  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
