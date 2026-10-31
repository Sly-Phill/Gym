import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import AppLayout from './components/AppLayout'
import RequireAuth from './components/RequireAuth'
import Landing from './pages/Landing'
import { Login, Signup } from './pages/AuthPages'

// App screens load on demand, so the landing page doesn't download the charts library.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Library = lazy(() => import('./pages/Library'))
const LiveWorkout = lazy(() => import('./pages/LiveWorkout'))
const Progress = lazy(() => import('./pages/Progress'))
const Classes = lazy(() => import('./pages/Classes'))
const Profile = lazy(() => import('./pages/Profile'))
const NotFound = lazy(() => import('./pages/NotFound'))

function GuestOnly({ children }) {
  const { status } = useAuth()
  return status === 'authed' ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            {/* v7_startTransition stays off: wrapping navigation in a transition stalls the
                AnimatePresence page fade. Setting both flags silences React Router's v7 warnings. */}
            <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: true }}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                  <Route path="/library" element={<RequireAuth><Library /></RequireAuth>} />
                  <Route path="/workout" element={<RequireAuth><LiveWorkout /></RequireAuth>} />
                  <Route path="/progress" element={<Progress />} />
                  <Route path="/classes" element={<Classes />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}
