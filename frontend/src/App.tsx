import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthProvider'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { LoginPage } from './features/auth/LoginPage'
import { SignupPage } from './features/auth/SignupPage'
import { KanbanBoard } from './features/kanban/KanbanBoard'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <KanbanBoard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App