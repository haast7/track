import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Pixels from './pages/Pixels'
import Channels from './pages/Channels'
import Domains from './pages/Domains'
import Funnels from './pages/Funnels'
import Leads from './pages/Leads'
import Postbacks from './pages/Postbacks'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" replace /> : <Register />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pixels"
          element={
            <ProtectedRoute>
              <Pixels />
            </ProtectedRoute>
          }
        />
        <Route
          path="/canais"
          element={
            <ProtectedRoute>
              <Channels />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dominios"
          element={
            <ProtectedRoute>
              <Domains />
            </ProtectedRoute>
          }
        />
        <Route
          path="/funis"
          element={
            <ProtectedRoute>
              <Funnels />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leads"
          element={
            <ProtectedRoute>
              <Leads />
            </ProtectedRoute>
          }
        />
        <Route
          path="/postbacks"
          element={
            <ProtectedRoute>
              <Postbacks />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
