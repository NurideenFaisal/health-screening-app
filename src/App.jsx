import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
// Import the Toaster for global notifications
import { Toaster } from 'sonner' 

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

// --- Section 2, 3, 4 ---
import ScreeningSection2 from './components/ScreeningSection2'
import ScreeningSection3 from './components/ScreeningSection3'
import ScreeningSection4 from './components/ScreeningSection4'

import RoleRoute from './components/RoleRoute'

// Dynamic section imports - maps section value to component
// This can be extended to dynamically import sections based on config
const SECTION_COMPONENTS = {
  '2': ScreeningSection2,
  '3': ScreeningSection3,
  '4': ScreeningSection4,
  // Add more sections here as needed
}

function App() {
  const { user, profile, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* Added a themed spinner to match your emerald UI */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Loading...</span>
      </div>
    )
  }

  return (
    <>
      {/* TOASTER SETUP: 
        This sits outside the Router so it's always available.
        richColors: Automatically skins success (green) and error (red).
        expand: Keeps multiple toasts stacked neatly.
      */}
      <Toaster 
        position="top-right" 
        richColors 
        closeButton 
        expand={false}
      />

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

            {/* PATIENT SCREENING - DYNAMIC SECTIONS */}
            <Route path="patient/:id" element={<ClinicianScreeningForm />}>

              {/* SECTION 1 TABS (Hardcoded as these are specific sub-components) */}
              <Route index element={<Vitals />} />
              <Route path="immunization" element={<Immunization />} />
              <Route path="development" element={<Development />} />

              {/* ADDITIONAL SECTIONS - Dynamically rendered */}
              {/* These routes handle section2, section3, section4, etc. */}
              <Route path="section2" element={<ScreeningSection2 />} />
              <Route path="section3" element={<ScreeningSection3 />} />
              <Route path="section4" element={<ScreeningSection4 />} />

              {/* Future sections can be added here as:
              <Route path="section5" element={<ScreeningSection5 />} />
              <Route path="section6" element={<ScreeningSection6 />} />
              /etc.
              */}

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
    </>
  )
}

export default App