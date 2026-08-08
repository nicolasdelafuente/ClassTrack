import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import {
  RequireAuth,
  RequireStudent,
  RequireTeacher,
} from './auth/RequireAuth'
import { AttendancePage } from './pages/AttendancePage'
import { BoardPage } from './pages/BoardPage'
import { ComposeEmailPage } from './pages/ComposeEmailPage'
import { DuplicateCoursePage } from './pages/DuplicateCoursePage'
import { GroupDetailPage } from './pages/GroupDetailPage'
import { InvitesPage } from './pages/InvitesPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { SchedulePage } from './pages/SchedulePage'
import { ScheduleSessionPage } from './pages/ScheduleSessionPage'
import { StudentHomePage } from './pages/StudentHomePage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/alumno"
            element={
              <RequireAuth>
                <RequireStudent>
                  <StudentHomePage />
                </RequireStudent>
              </RequireAuth>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <RequireTeacher>
                  <BoardPage />
                </RequireTeacher>
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:courseId/duplicate"
            element={
              <RequireAuth>
                <RequireTeacher>
                  <DuplicateCoursePage />
                </RequireTeacher>
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:courseId/invites"
            element={
              <RequireAuth>
                <RequireTeacher>
                  <InvitesPage />
                </RequireTeacher>
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:courseId/compose-email"
            element={
              <RequireAuth>
                <RequireTeacher>
                  <ComposeEmailPage />
                </RequireTeacher>
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:courseId/groups/:groupId"
            element={
              <RequireAuth>
                <RequireTeacher>
                  <GroupDetailPage />
                </RequireTeacher>
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:courseId/attendance"
            element={
              <RequireAuth>
                <RequireTeacher>
                  <AttendancePage />
                </RequireTeacher>
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:courseId/schedule"
            element={
              <RequireAuth>
                <RequireTeacher>
                  <SchedulePage />
                </RequireTeacher>
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:courseId/schedule/sessions/new"
            element={
              <RequireAuth>
                <RequireTeacher>
                  <ScheduleSessionPage />
                </RequireTeacher>
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:courseId/schedule/sessions/:sessionId"
            element={
              <RequireAuth>
                <RequireTeacher>
                  <ScheduleSessionPage />
                </RequireTeacher>
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
