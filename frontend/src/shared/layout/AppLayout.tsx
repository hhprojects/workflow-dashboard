import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth'
import { ThemeToggle } from '../theme/ThemeToggle'

export function AppLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen flex bg-pastel-bg dark:bg-dark-bg">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-[var(--color-pastel-border)]/30 dark:border-[var(--color-dark-border-subtle)] bg-[var(--color-pastel-sidebar)] dark:bg-[var(--color-dark-sidebar)]">
        {/* Logo / Brand */}
        <div className="px-5 py-5 border-b border-[var(--color-pastel-border)]/30 dark:border-[var(--color-dark-border-subtle)]">
          <h1 className="text-lg font-bold text-[var(--color-pastel-accent)] dark:text-[var(--color-dark-accent)] tracking-tight">
            Muse
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink
            to="/board"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[var(--color-pastel-sidebar-active)] dark:bg-[var(--color-dark-sidebar-active)] text-[var(--color-pastel-accent)] dark:text-[var(--color-dark-accent)] font-semibold'
                  : 'text-[var(--color-pastel-text-secondary)] dark:text-[var(--color-dark-text-secondary)] hover:bg-[var(--color-pastel-sidebar-hover)] dark:hover:bg-[var(--color-dark-sidebar-hover)] hover:text-[var(--color-pastel-text-primary)] dark:hover:text-[var(--color-dark-text-primary)]'
              }`
            }
          >
            {/* Kanban board icon */}
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            Board
          </NavLink>

          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[var(--color-pastel-sidebar-active)] dark:bg-[var(--color-dark-sidebar-active)] text-[var(--color-pastel-accent)] dark:text-[var(--color-dark-accent)] font-semibold'
                  : 'text-[var(--color-pastel-text-secondary)] dark:text-[var(--color-dark-text-secondary)] hover:bg-[var(--color-pastel-sidebar-hover)] dark:hover:bg-[var(--color-dark-sidebar-hover)] hover:text-[var(--color-pastel-text-primary)] dark:hover:text-[var(--color-dark-text-primary)]'
              }`
            }
          >
            {/* Calendar icon */}
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Calendar
          </NavLink>
        </nav>

        {/* Bottom section: user info + theme toggle */}
        <div className="px-3 py-4 border-t border-[var(--color-pastel-border)]/30 dark:border-[var(--color-dark-border-subtle)] space-y-3">
          <div className="flex items-center gap-2 px-3">
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            {/* User avatar circle */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white bg-[var(--color-pastel-accent)] dark:bg-[var(--color-dark-accent)] flex-shrink-0">
              {user?.email?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-pastel-text-primary)] dark:text-[var(--color-dark-text-primary)] truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)] hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-500 dark:hover:text-red-400 transition-all duration-150"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
