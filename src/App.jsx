import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { loadSession } from './lib/loadSession'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminSide/AdminDashboard'
import ClinicianDashboard from './pages/ClinicianSide/ClinicianDashboard'
import RoleRoute from './components/RoleRoute'
import ScreeningForm from './pages/AdminSide/ScreeningForm'
import Screening_data from './pages/AdminSide/Screening_Data'
import DashboardStats from './pages/AdminSide/DashboardStats'
import PatientData from './pages/AdminSide/PeopleData'
import RoleManagement from './pages/AdminSide/RoleManagement'
import ClinicianDashboardStats from './pages/ClinicianSide/ClinicianDashboardStats'
import ClinicianScreeningData from './pages/ClinicianSide/ClinicianScreeningData'
import ClinicianScreeningForm from './pages/ClinicianSide/ClinicianScreeningForm'
import ClinicianPatientData from './pages/ClinicianSide/ClinicianPatientData'



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

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <RoleRoute requiredRole="admin" user={user} profile={profile}>
            <AdminDashboard />
          </RoleRoute>
        }>
          <Route index element={<DashboardStats />} />
          <Route path="role-management" element={<RoleManagement />} />
          <Route path="patient-data" element={<PatientData />} />
          <Route path="screening-data" element={<Screening_data />} />
          <Route path="patient/:id" element={<ScreeningForm />} />
          <Route path="reports" element={<div>Reports Page</div>} />
        </Route>

        {/* Clinician Routes */}
        <Route path="/clinician/*" element={
          <RoleRoute requiredRole="clinician" user={user} profile={profile}>
            <ClinicianDashboard />
          </RoleRoute>
        }>
          <Route index element={<ClinicianDashboardStats />} />
          <Route path="patient-data" element={<ClinicianPatientData />} />
          <Route path="screening-data" element={<ClinicianScreeningData />} />
          <Route path="patient/:id" element={<ClinicianScreeningForm />} />
        </Route>

        <Route path="/" element={user ? <Navigate to={profile?.role === 'admin' ? '/admin' : '/clinician'} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
