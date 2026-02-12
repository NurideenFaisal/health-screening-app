import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { loadSession } from './lib/loadSession'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import ClinicianDashboard from './pages/ClinicianDashboard'
import RoleRoute from './components/RoleRoute'

function App() {
  const { user, profile, loading } = useAuthStore()

  useEffect(() => {
    loadSession()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <RoleRoute requiredRole="admin">
              <AdminDashboard />
            </RoleRoute>
          }
        />

        {/* Clinician Dashboard */}
        <Route
          path="/clinician"
          element={
            <RoleRoute requiredRole="clinician">
              <ClinicianDashboard />
            </RoleRoute>
          }
        />

        {/* Root redirect */}
        <Route
          path="/"
          element={
            user
              ? <Navigate to={profile?.role === 'admin' ? '/admin' : '/clinician'} />
              : <Navigate to="/login" />
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
