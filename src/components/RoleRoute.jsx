import { Navigate } from 'react-router-dom'
import { Users, Shield, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react'

export default function RoleRoute({ requiredRole, user, profile, children }) {
  // Still loading user or profile
  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // User not authenticated
  if (!user) return <Navigate to="/login" replace />

  // Convert to array if single role
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

  // Check if user is trying to access super-admin route
  const isSuperAdminRoute = window.location.pathname.startsWith('/super-admin')
  
  // Super-admin can access everything
  if (profile.role === 'super-admin') {
    return children
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
          <a 
            href={profile.role === 'admin' ? '/admin' : '/clinician'} 
            className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Return to Dashboard
          </a>
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
