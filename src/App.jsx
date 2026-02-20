import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import Login from './pages/Login'

// Admin
import AdminDashboard from './pages/AdminSide/AdminDashboard'
import DashboardStats from './pages/AdminSide/DashboardStats'
import RoleManagement from './pages/AdminSide/RoleManagement'
import ScreeningForm from './pages/AdminSide/ScreeningForm'
import ScreeningData from './pages/AdminSide/Screening_Data'
import PatientData from './pages/AdminSide/PeopleData'
import AdminCycleManager from './pages/AdminSide/AdminCycleManager'

// Clinician
import ClinicianDashboard from './pages/ClinicianSide/ClinicianDashboard'
import ClinicianDashboardStats from './pages/ClinicianSide/ClinicianDashboardStats'
import ClinicianPatientData from './pages/ClinicianSide/ClinicianPatientData'
import ClinicianScreeningData from './pages/ClinicianSide/ClinicianScreeningData'
import ClinicianScreeningForm from './pages/ClinicianSide/ClinicianScreeningForm'

import RoleRoute from './components/RoleRoute'

function App() {

  // Session already loaded in main.jsx
  const { user, profile, loading } = useAuthStore()

  // Loading Screen
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

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* ---------------- ADMIN ---------------- */}
        <Route
          path="/admin/*"
          element={
            <RoleRoute
              requiredRole="admin"
              user={user}
              profile={profile}
            >
              <AdminDashboard />
            </RoleRoute>
          }
        >
          <Route index element={<DashboardStats />} />
          <Route path="role-management" element={<RoleManagement />} />
          <Route path="cycle-manager" element={<AdminCycleManager />} />
          <Route path="patient-data" element={<PatientData />} />
          <Route path="screening-data" element={<ScreeningData />} />
          <Route path="patient/:id" element={<ScreeningForm />} />
          <Route path="reports" element={<div>Reports Page</div>} />
        </Route>


        {/* ---------------- CLINICIAN ---------------- */}
        <Route
          path="/clinician/*"
          element={
            <RoleRoute
              requiredRole="clinician"
              user={user}
              profile={profile}
            >
              <ClinicianDashboard />
            </RoleRoute>
          }
        >
          <Route index element={<ClinicianDashboardStats />} />
          <Route path="patient-data" element={<ClinicianPatientData />} />
          <Route path="screening-data" element={<ClinicianScreeningData />} />
          <Route path="patient/:id" element={<ClinicianScreeningForm />} />
        </Route>


        {/* Root Redirect */}
        <Route
          path="/"
          element={
            user
              ? (
                <Navigate
                  replace
                  to={profile?.role === 'admin'
                    ? '/admin'
                    : '/clinician'}
                />
              )
              : <Navigate replace to="/login" />
          }
        />

        {/* Catch All */}
        <Route path="*" element={<Navigate replace to="/" />} />

      </Routes>
    </Router>
  )
}

export default App
