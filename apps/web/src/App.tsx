import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AttendancePage } from './pages/AttendancePage'
import { BoardPage } from './pages/BoardPage'
import { GroupDetailPage } from './pages/GroupDetailPage'
import { SchedulePage } from './pages/SchedulePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BoardPage />} />
        <Route
          path="/courses/:courseId/groups/:groupId"
          element={<GroupDetailPage />}
        />
        <Route
          path="/courses/:courseId/attendance"
          element={<AttendancePage />}
        />
        <Route path="/courses/:courseId/schedule" element={<SchedulePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
