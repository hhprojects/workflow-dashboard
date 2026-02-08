import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-pastel-bg)] dark:bg-[var(--color-dark-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[var(--color-pastel-accent)] dark:border-[var(--color-dark-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
