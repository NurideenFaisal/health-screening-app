import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { lazy, Suspense } from 'react'
import { Toaster } from 'sonner'
import { useConnectivity } from './hooks/useConnectivity'

import Login from './pages/Login'

// --- Admin ---
const AdminDashboard = lazy(() => import('./pages/AdminSide/AdminDashboard'))
const DashboardStats = lazy(() => import('./pages/AdminSide/DashboardStats'))
const RoleManagement = lazy(() => import('./pages/AdminSide/RoleManagement'))
const ScreeningData = lazy(() => import('./pages/AdminSide/Screening_Data'))
const PatientData = lazy(() => import('./pages/AdminSide/PeopleData'))
const AdminCycleManager = lazy(() => import('./pages/AdminSide/AdminCycleManager'))

// --- Clinician ---
const ClinicianDashboard = lazy(() => import('./pages/ClinicianSide/ClinicianDashboard'))
const ClinicianDashboardStats = lazy(() => import('./pages/ClinicianSide/ClinicianDashboardStats'))
const ClinicianPatientData = lazy(() => import('./pages/ClinicianSide/ClinicianPatientData'))
const ClinicianScreeningData = lazy(() => import('./pages/ClinicianSide/ClinicianScreeningData'))
const ClinicianScreeningForm = lazy(() => import('./pages/ClinicianSide/ClinicianScreeningForm'))

// --- Section 1 Tabs ---
const Vitals = lazy(() => import('./components/ScreeningSection1/Vitals'))
const Immunization = lazy(() => import('./components/ScreeningSection1/Immunization'))
const Development = lazy(() => import('./components/ScreeningSection1/Development'))

import RoleRoute from './components/RoleRoute'

// --- Super Admin ---
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminSide/SuperAdminDashboard'))
const SuperAdminDashboardStats = lazy(() => import('./pages/SuperAdminSide/SuperAdminDashboardStats'))
const ClinicRegistry = lazy(() => import('./pages/SuperAdminSide/ClinicRegistry'))
const LaunchClinicWizard = lazy(() => import('./pages/SuperAdminSide/LaunchClinicWizard'))
const UserManagement = lazy(() => import('./pages/SuperAdminSide/UserManagement'))

// --- Lazy-loaded additional sections ---
const LAZY_SECTIONS = {
  '2': lazy(() => import('./components/ScreeningSection2')),
  '3': lazy(() => import('./components/ScreeningSection3')),
  '4': lazy(() => import('./components/ScreeningSection4')),
}

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
  useConnectivity()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Loading...</span>
      </div>
    )
  }

  return (
    <>
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
              <Suspense fallback={<SectionLoader />}>
                <RoleRoute requiredRole="super-admin" user={user} profile={profile}>
                  <SuperAdminDashboard />
                </RoleRoute>
              </Suspense>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<SectionLoader />}>
                  <SuperAdminDashboardStats />
                </Suspense>
              }
            />
            <Route
              path="dashboard"
              element={
                <Suspense fallback={<SectionLoader />}>
                  <SuperAdminDashboardStats />
                </Suspense>
              }
            />
            <Route
              path="clinics"
              element={
                <Suspense fallback={<SectionLoader />}>
                  <ClinicRegistry />
                </Suspense>
              }
            />
            <Route
              path="launch-clinic"
              element={
                <Suspense fallback={<SectionLoader />}>
                  <LaunchClinicWizard />
                </Suspense>
              }
            />
            <Route path="settings" element={<Navigate replace to="/super-admin/launch-clinic" />} />
            <Route
              path="users"
              element={
                <Suspense fallback={<SectionLoader />}>
                  <UserManagement />
                </Suspense>
              }
            />
          </Route>

          {/* ADMIN */}
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<SectionLoader />}>
                <RoleRoute requiredRole="admin" user={user} profile={profile}>
                  <AdminDashboard />
                </RoleRoute>
              </Suspense>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<SectionLoader />}>
                  <DashboardStats />
                </Suspense>
              }
            />
            <Route
              path="role-management"
              element={
                <Suspense fallback={<SectionLoader />}>
                  <RoleManagement />
                </Suspense>
              }
            />
            <Route
              path="cycle-manager"
              element={
                <Suspense fallback={<SectionLoader />}>
                  <AdminCycleManager />
                </Suspense>
              }
            />
            <Route
              path="patient-data"
              element={
                <Suspense fallback={<SectionLoader />}>
                  <PatientData />
                </Suspense>
              }
            />
            <Route
              path="screening-data"
              element={
                <Suspense fallback={<SectionLoader />}>
                  <ScreeningData />
                </Suspense>
              }
            />
          </Route>

          {/* CLINICIAN */}
          <Route
            path="/clinician/*"
            element={
              <Suspense fallback={<SectionLoader />}>
                <RoleRoute requiredRole="clinician" user={user} profile={profile}>
                  <ClinicianDashboard />
                </RoleRoute>
              </Suspense>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<SectionLoader />}>
                  <ClinicianDashboardStats />
                </Suspense>
              }
            />
            <Route
              path="patient-data"
              element={
                <Suspense fallback={<SectionLoader />}>
                  <ClinicianPatientData />
                </Suspense>
              }
            />
            <Route
              path="screening-data"
              element={
                <Suspense fallback={<SectionLoader />}>
                  <ClinicianScreeningData />
                </Suspense>
              }
            />

            <Route
              path="patient/:id"
              element={
                <Suspense fallback={<SectionLoader />}>
                  <ClinicianScreeningForm />
                </Suspense>
              }
            >
              <Route
                index
                element={
                  <Suspense fallback={<SectionLoader />}>
                    <Vitals />
                  </Suspense>
                }
              />
              <Route
                path="immunization"
                element={
                  <Suspense fallback={<SectionLoader />}>
                    <Immunization />
                  </Suspense>
                }
              />
              <Route
                path="development"
                element={
                  <Suspense fallback={<SectionLoader />}>
                    <Development />
                  </Suspense>
                }
              />

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