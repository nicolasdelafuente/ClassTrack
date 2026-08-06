import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BoardPage } from './pages/BoardPage'
import { GroupDetailPage } from './pages/GroupDetailPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BoardPage />} />
        <Route
          path="/courses/:courseId/groups/:groupId"
          element={<GroupDetailPage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
