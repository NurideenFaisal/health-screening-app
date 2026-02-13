import { Navigate } from 'react-router-dom'

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

  // Role doesn't match
  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
