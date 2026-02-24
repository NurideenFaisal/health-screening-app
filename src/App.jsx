import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

import Login from './pages/Login'

// --- Admin ---
import AdminDashboard from './pages/AdminSide/AdminDashboard'
import DashboardStats from './pages/AdminSide/DashboardStats'
import RoleManagement from './pages/AdminSide/RoleManagement'
import ScreeningData from './pages/AdminSide/Screening_Data'
import PatientData from './pages/AdminSide/PeopleData'
import AdminCycleManager from './pages/AdminSide/AdminCycleManager'

// --- Clinician ---
import ClinicianDashboard from './pages/ClinicianSide/ClinicianDashboard'
import ClinicianDashboardStats from './pages/ClinicianSide/ClinicianDashboardStats'
import ClinicianPatientData from './pages/ClinicianSide/ClinicianPatientData'
import ClinicianScreeningData from './pages/ClinicianSide/ClinicianScreeningData'
import ClinicianScreeningForm from './pages/ClinicianSide/ClinicianScreeningForm'

// --- Section 1 Tabs ---
import Vitals from './components/ScreeningSection1/Vitals'
import Immunization from './components/ScreeningSection1/Immunization'
import Development from './components/ScreeningSection1/Development'

// --- Section 2 & 3 & 4---
import ScreeningSection2 from './components/ScreeningSection2'
import ScreeningSection3 from './components/ScreeningSection3'
import ScreeningSection4 from './components/ScreeningSection4'

import RoleRoute from './components/RoleRoute'

function App() {
  const { user, profile, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  return (
    <Router>
      <Routes>

        <Route path="/login" element={<Login />} />

        {/* ADMIN */}
        <Route
          path="/admin/*"
          element={
            <RoleRoute requiredRole="admin" user={user} profile={profile}>
              <AdminDashboard />
            </RoleRoute>
          }
        >
          <Route index element={<DashboardStats />} />
          <Route path="role-management" element={<RoleManagement />} />
          <Route path="cycle-manager" element={<AdminCycleManager />} />
          <Route path="patient-data" element={<PatientData />} />
          <Route path="screening-data" element={<ScreeningData />} />
        </Route>

        {/* CLINICIAN */}
        <Route
          path="/clinician/*"
          element={
            <RoleRoute requiredRole="clinician" user={user} profile={profile}>
              <ClinicianDashboard />
            </RoleRoute>
          }
        >
          <Route index element={<ClinicianDashboardStats />} />
          <Route path="patient-data" element={<ClinicianPatientData />} />
          <Route path="screening-data" element={<ClinicianScreeningData />} />

          {/* PATIENT SCREENING */}
          <Route path="patient/:id" element={<ClinicianScreeningForm />}>

            {/* SECTION 1 (DIRECT TABS) */}
            <Route index element={<Vitals />} />
            <Route path="immunization" element={<Immunization />} />
            <Route path="development" element={<Development />} />

            {/* SECTION 2 & 3 */}
            <Route path="section2" element={<ScreeningSection2 />} />
            <Route path="section3" element={<ScreeningSection3 />} />
            <Route path="section4" element={<ScreeningSection4 />} />

          </Route>
        </Route>

        {/* ROOT */}
        <Route
          path="/"
          element={
            user
              ? <Navigate replace to={profile?.role === 'admin' ? '/admin' : '/clinician'} />
              : <Navigate replace to="/login" />
          }
        />

        <Route path="*" element={<Navigate replace to="/" />} />

      </Routes>
    </Router>
  )
}

export default App