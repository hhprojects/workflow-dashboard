import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../../../shared/theme/ThemeToggle'
import { supabase } from '../../../shared/lib/supabase'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-pastel-bg)] via-[var(--color-pastel-bg-alt)] to-[#EFF6FF] dark:from-[var(--color-dark-bg)] dark:via-[var(--color-dark-bg)] dark:to-[var(--color-dark-bg-alt)]">
      {/* Theme toggle in corner */}
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md px-4">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-pastel-accent)] dark:text-[var(--color-dark-accent)]">
            Muse
          </h1>
          <p className="mt-2 text-sm text-[var(--color-pastel-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">Welcome back to your workspace</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-[var(--color-dark-column)] backdrop-blur-sm p-8 rounded-2xl shadow-pastel-lg dark:shadow-none border border-[var(--color-pastel-border)]/20 dark:border-[var(--color-dark-border-subtle)]">
          <h2 className="text-xl font-bold mb-6 text-[var(--color-pastel-text-primary)] dark:text-[var(--color-dark-text-primary)]">Sign in</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--color-pastel-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--color-pastel-border)]/30 dark:border-[var(--color-dark-border-subtle)] rounded-xl bg-white dark:bg-[var(--color-dark-bg)] text-[var(--color-pastel-text-primary)] dark:text-[var(--color-dark-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pastel-accent)]/40 dark:focus:ring-[var(--color-dark-accent)]/40 text-sm placeholder-[var(--color-pastel-text-muted)] dark:placeholder-[var(--color-dark-text-muted)]"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--color-pastel-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--color-pastel-border)]/30 dark:border-[var(--color-dark-border-subtle)] rounded-xl bg-white dark:bg-[var(--color-dark-bg)] text-[var(--color-pastel-text-primary)] dark:text-[var(--color-dark-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pastel-accent)]/40 dark:focus:ring-[var(--color-dark-accent)]/40 text-sm placeholder-[var(--color-pastel-text-muted)] dark:placeholder-[var(--color-dark-text-muted)]"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-pastel-accent)] hover:bg-[var(--color-pastel-accent-hover)] dark:bg-[var(--color-dark-accent)] dark:hover:bg-[var(--color-dark-accent-hover)] text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--color-pastel-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[var(--color-pastel-accent)] dark:text-[var(--color-dark-accent)] hover:underline font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
