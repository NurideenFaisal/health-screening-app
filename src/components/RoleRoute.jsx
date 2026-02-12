import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function RoleRoute({ requiredRole, children }) {
  const { user, profile, loading } = useAuthStore()

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role !== requiredRole) return <Navigate to="/" replace />

  return children
}