import { MONTH_NAMES } from '../utils/calendar.utils'

type Props = {
  currentMonth: number
  currentYear: number
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onNewEvent: () => void
}

export function CalendarHeader({ currentMonth, currentYear, onPrev, onNext, onToday, onNewEvent }: Props) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-[var(--color-pastel-text-primary)] dark:text-[var(--color-dark-text-primary)]">
          {MONTH_NAMES[currentMonth]}{' '}
          <span className="font-normal text-[var(--color-pastel-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
            {currentYear}
          </span>
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {/* New Event button */}
        <button
          onClick={onNewEvent}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold bg-[var(--color-pastel-accent)] hover:bg-[var(--color-pastel-accent-hover)] dark:bg-[var(--color-dark-accent)] dark:hover:bg-[var(--color-dark-accent-hover)] text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New
        </button>

        <div className="w-px h-6 bg-[var(--color-pastel-border)]/30 dark:bg-[var(--color-dark-border-subtle)] mx-1" />

        {/* Previous month */}
        <button
          onClick={onPrev}
          className="p-2 rounded-xl hover:bg-[var(--color-pastel-sidebar-hover)] dark:hover:bg-[var(--color-dark-sidebar-hover)] text-[var(--color-pastel-text-secondary)] dark:text-[var(--color-dark-text-secondary)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Today button */}
        <button
          onClick={onToday}
          className="px-3 py-1.5 rounded-xl text-sm font-medium border border-[var(--color-pastel-border)]/50 dark:border-[var(--color-dark-border-subtle)] text-[var(--color-pastel-text-primary)] dark:text-[var(--color-dark-text-primary)] hover:bg-[var(--color-pastel-sidebar-hover)] dark:hover:bg-[var(--color-dark-sidebar-hover)] transition-colors"
        >
          Today
        </button>

        {/* Next month */}
        <button
          onClick={onNext}
          className="p-2 rounded-xl hover:bg-[var(--color-pastel-sidebar-hover)] dark:hover:bg-[var(--color-dark-sidebar-hover)] text-[var(--color-pastel-text-secondary)] dark:text-[var(--color-dark-text-secondary)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
