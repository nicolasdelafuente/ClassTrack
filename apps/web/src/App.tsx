import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { AttendancePage } from './pages/AttendancePage'
import { BoardPage } from './pages/BoardPage'
import { GroupDetailPage } from './pages/GroupDetailPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { SchedulePage } from './pages/SchedulePage'
import { ScheduleSessionPage } from './pages/ScheduleSessionPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <BoardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:courseId/groups/:groupId"
            element={
              <RequireAuth>
                <GroupDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:courseId/attendance"
            element={
              <RequireAuth>
                <AttendancePage />
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:courseId/schedule"
            element={
              <RequireAuth>
                <SchedulePage />
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:courseId/schedule/sessions/new"
            element={
              <RequireAuth>
                <ScheduleSessionPage />
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:courseId/schedule/sessions/:sessionId"
            element={
              <RequireAuth>
                <ScheduleSessionPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
