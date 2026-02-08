import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-[var(--color-dark-column)] rounded-2xl shadow-pastel-lg dark:shadow-none border border-[var(--color-pastel-border)]/20 dark:border-[var(--color-dark-border-subtle)] animate-[modalIn_0.15s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-pastel-border)]/20 dark:border-[var(--color-dark-border-subtle)]">
          <h3 className="text-lg font-bold text-[var(--color-pastel-text-primary)] dark:text-[var(--color-dark-text-primary)]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)] hover:bg-[var(--color-pastel-sidebar-hover)] dark:hover:bg-[var(--color-dark-sidebar-hover)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
