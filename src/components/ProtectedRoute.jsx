import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()

  if (loading) return <div className="p-8">Loading...</div>

  if (!user) return <Navigate to="/login" />

  return children
}