import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { lazy, Suspense } from 'react'
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

// --- Section 1 Tabs (Eager load - these are commonly used) ---
import Vitals from './components/ScreeningSection1/Vitals'
import Immunization from './components/ScreeningSection1/Immunization'
import Development from './components/ScreeningSection1/Development'

import RoleRoute from './components/RoleRoute'

// --- Super Admin ---
import SuperAdminDashboard from './pages/SuperAdminSide/SuperAdminDashboard'
import SuperAdminDashboardStats from './pages/SuperAdminSide/SuperAdminDashboardStats'
import ClinicRegistry from './pages/SuperAdminSide/ClinicRegistry'
import LaunchClinicWizard from './pages/SuperAdminSide/LaunchClinicWizard'
import UserManagement from './pages/SuperAdminSide/UserManagement'

// --- Lazy-loaded additional sections ---
// To add new sections:
// 1. Create component at ./components/ScreeningSection{N}/index.js
// 2. Add entry to LAZY_SECTIONS map below
// 3. Add route path to sections config in src/config/sections.js
const LAZY_SECTIONS = {
  '2': lazy(() => import('./components/ScreeningSection2')),
  '3': lazy(() => import('./components/ScreeningSection3')),
  '4': lazy(() => import('./components/ScreeningSection4')),
  // Add future sections here - they'll be lazy loaded automatically
  // '5': lazy(() => import('./components/ScreeningSection5')),
  // '6': lazy(() => import('./components/ScreeningSection6')),
}

// Loading fallback for lazy sections
function SectionLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      <span className="ml-3 text-gray-500 font-medium">Loading section...</span>
    </div>
  )
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

          {/* SUPER ADMIN */}
          <Route
            path="/super-admin/*"
            element={
              <RoleRoute requiredRole="super-admin" user={user} profile={profile}>
                <SuperAdminDashboard />
              </RoleRoute>
            }
          >
            <Route index element={<SuperAdminDashboardStats />} />
            <Route path="dashboard" element={<SuperAdminDashboardStats />} />
            <Route path="clinics" element={<ClinicRegistry />} />
            <Route path="launch-clinic" element={<LaunchClinicWizard />} />
            <Route path="settings" element={<Navigate replace to="/super-admin/launch-clinic" />} />
            <Route path="users" element={<UserManagement />} />
          </Route>

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

              {/* SECTION 1 TABS (Eager loaded - commonly used) */}
              <Route index element={<Vitals />} />
              <Route path="immunization" element={<Immunization />} />
              <Route path="development" element={<Development />} />

              {/* ADDITIONAL SECTIONS - Lazy loaded for performance */}
              {/* Routes are dynamically generated from LAZY_SECTIONS map */}
              {/* To add new sections: update LAZY_SECTIONS map above */}
              {Object.entries(LAZY_SECTIONS).map(([sectionNum, LazyComponent]) => (
                <Route
                  key={sectionNum}
                  path={`section${sectionNum}`}
                  element={
                    <Suspense fallback={<SectionLoader />}>
                      <LazyComponent />
                    </Suspense>
                  }
                />
              ))}

            </Route>
          </Route>

          {/* ROOT */}
          <Route
            path="/"
            element={
              user
                ? <Navigate replace to={
                    profile?.role === 'super-admin' 
                      ? '/super-admin/dashboard' 
                      : profile?.role === 'admin' 
                        ? '/admin' 
                        : '/clinician'
                  } />
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
