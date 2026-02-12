import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'

function Dashboard() {
  return <div className="p-8">Dashboard coming next</div>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  )
}
