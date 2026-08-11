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
import { GradesPage } from './pages/GradesPage'
import { GroupDetailPage } from './pages/GroupDetailPage'
import { GroupsSetupPage } from './pages/GroupsSetupPage'
import { InvitesPage } from './pages/InvitesPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { SchedulePage } from './pages/SchedulePage'
import { ScheduleSessionPage } from './pages/ScheduleSessionPage'
import { StudentHomePage } from './pages/StudentHomePage'
import { StudentGroupPage } from './pages/StudentGroupPage'
import { StudentProfilePage } from './pages/StudentProfilePage'
import { StudentSprintSheetPage } from './pages/StudentSprintSheetPage'
import { TeacherGroupSprintPage } from './pages/TeacherGroupSprintPage'
import { TeacherSprintSheetDetailPage } from './pages/TeacherSprintSheetDetailPage'
import { TeacherSprintSheetsPage } from './pages/TeacherSprintSheetsPage'

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
            path="/alumno/grupos/:groupId"
            element={
              <RequireAuth>
                <RequireStudent>
                  <StudentGroupPage />
                </RequireStudent>
              </RequireAuth>
            }
          />
          <Route
            path="/alumno/grupos/:groupId/sprints/:sprintNumber"
            element={
              <RequireAuth>
                <RequireStudent>
                  <StudentSprintSheetPage />
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
            path="/courses/:courseId/sprint-sheets"
            element={
              <RequireAuth>
                <RequireTeacher>
                  <TeacherSprintSheetsPage />
                </RequireTeacher>
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:courseId/sprint-sheets/:sheetId"
            element={
              <RequireAuth>
                <RequireTeacher>
                  <TeacherSprintSheetDetailPage />
                </RequireTeacher>
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:courseId/grades/preliminary"
            element={
              <RequireAuth>
                <RequireTeacher>
                  <GradesPage mode="preliminary" />
                </RequireTeacher>
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:courseId/grades/final"
            element={
              <RequireAuth>
                <RequireTeacher>
                  <GradesPage mode="final" />
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
            path="/courses/:courseId/groups/setup"
            element={
              <RequireAuth>
                <RequireTeacher>
                  <GroupsSetupPage />
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
            path="/courses/:courseId/groups/:groupId/sprints/:sprintNumber"
            element={
              <RequireAuth>
                <RequireTeacher>
                  <TeacherGroupSprintPage />
                </RequireTeacher>
              </RequireAuth>
            }
          />
          <Route
            path="/courses/:courseId/groups/:groupId/students/:studentId"
            element={
              <RequireAuth>
                <RequireTeacher>
                  <StudentProfilePage />
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
