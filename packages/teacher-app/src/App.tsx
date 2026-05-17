import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/appStore'
import { setBaseUrl } from './api/client'
import { aiApi } from './api/client'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import QuizManager from './pages/QuizManager'
import Analytics from './pages/Analytics'
import Homework from './pages/Homework'
import Reports from './pages/Reports'
import Sidebar from './components/Sidebar'

declare global {
  interface Window {
    electronAPI?: {
      getServerPort: () => Promise<number>
      openExternal: (url: string) => Promise<void>
    }
  }
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">{children}</div>
    </div>
  )
}

export default function App() {
  const { teacher, setAiStatus } = useAppStore()

  useEffect(() => {
    // Discover backend port from Electron or default to 3001
    async function init() {
      let port = 3001
      if (window.electronAPI) {
        port = await window.electronAPI.getServerPort()
      }
      setBaseUrl(port)

      // Check AI status
      try {
        const status = await aiApi.status()
        setAiStatus(status.provider, status.available)
      } catch {}
    }
    init()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={teacher ? <Navigate to="/" /> : <Login />} />
        <Route
          path="/"
          element={
            teacher ? (
              <AppShell><Dashboard /></AppShell>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/chat"
          element={teacher ? <AppShell><Chat /></AppShell> : <Navigate to="/login" />}
        />
        <Route
          path="/quiz"
          element={teacher ? <AppShell><QuizManager /></AppShell> : <Navigate to="/login" />}
        />
        <Route
          path="/analytics"
          element={teacher ? <AppShell><Analytics /></AppShell> : <Navigate to="/login" />}
        />
        <Route
          path="/homework"
          element={teacher ? <AppShell><Homework /></AppShell> : <Navigate to="/login" />}
        />
        <Route
          path="/reports"
          element={teacher ? <AppShell><Reports /></AppShell> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to={teacher ? '/' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  )
}
