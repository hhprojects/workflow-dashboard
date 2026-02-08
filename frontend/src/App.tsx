import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, LoginPage, ProtectedRoute, SignupPage } from './features/auth'
import { ThemeProvider } from './shared/theme/ThemeContext'
import { AppLayout } from './shared/layout/AppLayout'
import { KanbanBoard } from './features/kanban/KanbanBoard'
import { CalendarView } from './features/calendar/CalendarView'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/board" element={<KanbanBoard />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/" element={<Navigate to="/board" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
