import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { lazy, Suspense, useEffect } from 'react'
import { Toaster } from 'sonner'
import { AlertCircle } from 'lucide-react'
import { useConnectivity } from './hooks/useConnectivity'
import { supabase } from './lib/supabase'

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

// --- Super Admin ---
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminSide/SuperAdminDashboard'))
const SuperAdminDashboardStats = lazy(() => import('./pages/SuperAdminSide/SuperAdminDashboardStats'))
const ClinicRegistry = lazy(() => import('./pages/SuperAdminSide/ClinicRegistry'))
const LaunchClinicWizard = lazy(() => import('./pages/SuperAdminSide/LaunchClinicWizard'))
const UserManagement = lazy(() => import('./pages/SuperAdminSide/UserManagement'))
const TemplateManagement = lazy(() => import('./pages/SuperAdminSide/TemplateManagement'))
const FormBuilder = lazy(() => import('./pages/FormBuilder/FormBuilder'))

import RoleRoute from './components/RoleRoute'

function SectionLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      <span className="ml-3 text-gray-500 font-medium">Loading section...</span>
    </div>
  )
}

function App() {
  const { user, profile, loading, setAuth, clearAuth } = useAuthStore()
  useConnectivity()

  useEffect(() => {
    const CACHE_KEY = 'auth_profile_cache'

    const initAuth = async () => {
      const cached = localStorage.getItem(CACHE_KEY)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          try {
            const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
            if (p) { setAuth(session.user, p); localStorage.setItem(CACHE_KEY, JSON.stringify(p)); return }
          } catch { }
          if (cached) { setAuth(session.user, JSON.parse(cached)); return }
        }
        if (!cached) clearAuth()
      } catch {
        if (cached) {
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }))
          if (session) setAuth(session.user, JSON.parse(cached))
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') {
        localStorage.removeItem(CACHE_KEY)
        clearAuth()
        return
      }
      if (session) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data: p }) => {
          if (p) { setAuth(session.user, p); localStorage.setItem(CACHE_KEY, JSON.stringify(p)) }
        }).catch(() => {
          const cached = localStorage.getItem(CACHE_KEY)
          if (cached) setAuth(session.user, JSON.parse(cached))
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Loading...</span>
      </div>
    )
  }

  if (profile && profile.is_active === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Account Disabled</h2>
          <p className="text-gray-500 mt-2">Contact your administrator to regain access.</p>
          <button onClick={async () => {
            await supabase.auth.signOut()
            localStorage.removeItem('auth_profile_cache')
            clearAuth()
          }} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Sign Out</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-right" richColors closeButton expand={false} />
      <Router>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

          <Route path="/super-admin" element={
            <Suspense fallback={<SectionLoader />}>
              <RoleRoute requiredRole="super-admin" user={user} profile={profile}>
                <SuperAdminDashboard />
              </RoleRoute>
            </Suspense>
          }>
            <Route index element={<Suspense fallback={<SectionLoader />}><SuperAdminDashboardStats /></Suspense>} />
            <Route path="dashboard" element={<Suspense fallback={<SectionLoader />}><SuperAdminDashboardStats /></Suspense>} />
            <Route path="clinics" element={<Suspense fallback={<SectionLoader />}><ClinicRegistry /></Suspense>} />
            <Route path="launch-clinic" element={<Suspense fallback={<SectionLoader />}><LaunchClinicWizard /></Suspense>} />
            <Route path="users" element={<Suspense fallback={<SectionLoader />}><UserManagement /></Suspense>} />
            <Route path="templates" element={<Suspense fallback={<SectionLoader />}><TemplateManagement /></Suspense>} />
            <Route path="form-builder" element={<Suspense fallback={<SectionLoader />}><FormBuilder /></Suspense>} />
            <Route path="*" element={<Navigate replace to="/super-admin/dashboard" />} />
          </Route>

          <Route path="/admin" element={
            <Suspense fallback={<SectionLoader />}>
              <RoleRoute requiredRole="admin" user={user} profile={profile}>
                <AdminDashboard />
              </RoleRoute>
            </Suspense>
          }>
            <Route index element={<Suspense fallback={<SectionLoader />}><DashboardStats /></Suspense>} />
            <Route path="dashboard" element={<Suspense fallback={<SectionLoader />}><DashboardStats /></Suspense>} />
            <Route path="role-management" element={<Suspense fallback={<SectionLoader />}><RoleManagement /></Suspense>} />
            <Route path="cycle-manager" element={<Suspense fallback={<SectionLoader />}><AdminCycleManager /></Suspense>} />
            <Route path="patient-data" element={<Suspense fallback={<SectionLoader />}><PatientData /></Suspense>} />
            <Route path="screening-data" element={<Suspense fallback={<SectionLoader />}><ScreeningData /></Suspense>} />
            <Route path="*" element={<Navigate replace to="/admin/dashboard" />} />
          </Route>

          <Route path="/clinician" element={
            <Suspense fallback={<SectionLoader />}>
              <RoleRoute requiredRole="clinician" user={user} profile={profile}>
                <ClinicianDashboard />
              </RoleRoute>
            </Suspense>
          }>
            <Route index element={<Suspense fallback={<SectionLoader />}><ClinicianDashboardStats /></Suspense>} />
            <Route path="dashboard" element={<Suspense fallback={<SectionLoader />}><ClinicianDashboardStats /></Suspense>} />
            <Route path="patient-data" element={<Suspense fallback={<SectionLoader />}><ClinicianPatientData /></Suspense>} />
            <Route path="screening-data" element={<Suspense fallback={<SectionLoader />}><ClinicianScreeningData /></Suspense>} />
            <Route path="patient/:id" element={<Suspense fallback={<SectionLoader />}><ClinicianScreeningForm /></Suspense>} />
            <Route path="*" element={<Navigate replace to="/clinician/dashboard" />} />
          </Route>

          <Route path="/" element={
            user && profile
              ? <Navigate replace to={profile.role === 'super-admin' ? '/super-admin/dashboard' : profile.role === 'admin' ? '/admin/dashboard' : '/clinician/dashboard'} />
              : <Navigate replace to="/login" />
          } />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </Router>
    </>
  )
}

export default App