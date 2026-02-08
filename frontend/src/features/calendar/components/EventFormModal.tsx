import { useState, useEffect } from 'react'
import { Modal } from '../../../shared/components/Modal'
import type { CalendarEvent, EventColor } from '../../../shared/types/database'
import { EVENT_COLOR_VALUES } from '../utils/calendar.utils'

type Tab = 'event' | 'task'

type Props = {
  isOpen: boolean
  onClose: () => void
  prefilledDate: string
  defaultTab: Tab
  editingEvent?: CalendarEvent | null
  onCreateEvent: (data: {
    title: string
    description: string
    startDate: string
    endDate: string
    isAllDay: boolean
    startTime: string
    endTime: string
    color: EventColor
  }) => Promise<void>
  onUpdateEvent?: (data: {
    eventId: string
    title: string
    description: string
    startDate: string
    endDate: string
    isAllDay: boolean
    startTime: string
    endTime: string
    color: EventColor
  }) => Promise<void>
  onCreateTask: (data: {
    title: string
    description: string
    dueDate: string | null
    priority: 'low' | 'medium' | 'high'
  }) => Promise<void>
}

const COLOR_OPTIONS: EventColor[] = ['pink', 'blue', 'purple', 'green', 'orange', 'red']

export function EventFormModal({
  isOpen,
  onClose,
  prefilledDate,
  defaultTab,
  editingEvent,
  onCreateEvent,
  onUpdateEvent,
  onCreateTask,
}: Props) {
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [saving, setSaving] = useState(false)

  // Event fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(prefilledDate)
  const [endDate, setEndDate] = useState(prefilledDate)
  const [isAllDay, setIsAllDay] = useState(true)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [color, setColor] = useState<EventColor>('pink')

  // Task fields
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [hasDueDate, setHasDueDate] = useState(true)
  const [taskDueDate, setTaskDueDate] = useState(prefilledDate)
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium')

  // Reset form when modal opens or editing event changes
  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        setTab('event')
        setTitle(editingEvent.title)
        setDescription(editingEvent.description ?? '')
        setStartDate(editingEvent.start_date)
        setEndDate(editingEvent.end_date)
        setIsAllDay(editingEvent.is_all_day)
        setStartTime(editingEvent.start_time?.slice(0, 5) ?? '09:00')
        setEndTime(editingEvent.end_time?.slice(0, 5) ?? '10:00')
        setColor(editingEvent.color)
      } else {
        setTab(defaultTab)
        setTitle('')
        setDescription('')
        setStartDate(prefilledDate)
        setEndDate(prefilledDate)
        setIsAllDay(true)
        setStartTime('09:00')
        setEndTime('10:00')
        setColor('pink')
        setTaskTitle('')
        setTaskDescription('')
        setHasDueDate(true)
        setTaskDueDate(prefilledDate)
        setTaskPriority('medium')
      }
    }
  }, [isOpen, prefilledDate, defaultTab, editingEvent])

  async function handleSubmitEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    try {
      if (editingEvent && onUpdateEvent) {
        await onUpdateEvent({
          eventId: editingEvent.id,
          title,
          description,
          startDate,
          endDate,
          isAllDay,
          startTime,
          endTime,
          color,
        })
      } else {
        await onCreateEvent({
          title,
          description,
          startDate,
          endDate,
          isAllDay,
          startTime,
          endTime,
          color,
        })
      }
      onClose()
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitTask(e: React.FormEvent) {
    e.preventDefault()
    if (!taskTitle.trim()) return

    setSaving(true)
    try {
      await onCreateTask({
        title: taskTitle,
        description: taskDescription,
        dueDate: hasDueDate ? taskDueDate : null,
        priority: taskPriority,
      })
      onClose()
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-[var(--color-pastel-border)]/30 dark:border-[var(--color-dark-border-subtle)] rounded-xl bg-white dark:bg-[var(--color-dark-bg)] text-[var(--color-pastel-text-primary)] dark:text-[var(--color-dark-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pastel-accent)]/40 dark:focus:ring-[var(--color-dark-accent)]/40 text-sm placeholder-[var(--color-pastel-text-muted)] dark:placeholder-[var(--color-dark-text-muted)]'

  const labelClass =
    'block text-sm font-medium mb-1 text-[var(--color-pastel-text-secondary)] dark:text-[var(--color-dark-text-secondary)]'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingEvent ? 'Edit Event' : 'Create New'}
    >
      {/* Tab switcher (hide tabs when editing an event) */}
      {!editingEvent && (
        <div className="flex gap-1 mb-5 p-1 bg-[var(--color-pastel-bg)]/50 dark:bg-[var(--color-dark-bg)]/50 rounded-xl">
          <button
            type="button"
            onClick={() => setTab('event')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === 'event'
                ? 'bg-white dark:bg-[var(--color-dark-column)] text-[var(--color-pastel-accent)] dark:text-[var(--color-dark-accent)] shadow-sm'
                : 'text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)] hover:text-[var(--color-pastel-text-secondary)] dark:hover:text-[var(--color-dark-text-secondary)]'
            }`}
          >
            Event
          </button>
          <button
            type="button"
            onClick={() => setTab('task')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === 'task'
                ? 'bg-white dark:bg-[var(--color-dark-column)] text-[var(--color-pastel-accent)] dark:text-[var(--color-dark-accent)] shadow-sm'
                : 'text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)] hover:text-[var(--color-pastel-text-secondary)] dark:hover:text-[var(--color-dark-text-secondary)]'
            }`}
          >
            Task
          </button>
        </div>
      )}

      {/* EVENT TAB */}
      {tab === 'event' && (
        <form onSubmit={handleSubmitEvent} className="space-y-4">
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="Event title"
              required
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Optional description"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (e.target.value > endDate) setEndDate(e.target.value)
                }}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* All-day toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              className={`relative w-9 h-5 rounded-full transition-colors ${
                isAllDay
                  ? 'bg-[var(--color-pastel-accent)] dark:bg-[var(--color-dark-accent)]'
                  : 'bg-[var(--color-pastel-border)] dark:bg-[var(--color-dark-border)]'
              }`}
              onClick={() => setIsAllDay(!isAllDay)}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  isAllDay ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-sm text-[var(--color-pastel-text-primary)] dark:text-[var(--color-dark-text-primary)]">
              All day
            </span>
          </label>

          {/* Time pickers (shown when not all-day) */}
          {!isAllDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Color picker */}
          <div>
            <label className={labelClass}>Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    color === c
                      ? 'ring-2 ring-offset-2 ring-[var(--color-pastel-text-primary)] dark:ring-[var(--color-dark-text-primary)] ring-offset-white dark:ring-offset-[var(--color-dark-column)] scale-110'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: EVENT_COLOR_VALUES[c] }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-sm font-medium text-[var(--color-pastel-text-secondary)] dark:text-[var(--color-dark-text-secondary)] hover:bg-[var(--color-pastel-sidebar-hover)] dark:hover:bg-[var(--color-dark-sidebar-hover)] border border-[var(--color-pastel-border)]/30 dark:border-[var(--color-dark-border-subtle)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="flex-1 py-2 rounded-xl text-sm font-semibold bg-[var(--color-pastel-accent)] hover:bg-[var(--color-pastel-accent-hover)] dark:bg-[var(--color-dark-accent)] dark:hover:bg-[var(--color-dark-accent-hover)] text-white disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      )}

      {/* TASK TAB */}
      {tab === 'task' && (
        <form onSubmit={handleSubmitTask} className="space-y-4">
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className={inputClass}
              placeholder="Task title"
              required
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Optional description"
              rows={2}
            />
          </div>

          {/* Due date toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              className={`relative w-9 h-5 rounded-full transition-colors ${
                hasDueDate
                  ? 'bg-[var(--color-pastel-accent)] dark:bg-[var(--color-dark-accent)]'
                  : 'bg-[var(--color-pastel-border)] dark:bg-[var(--color-dark-border)]'
              }`}
              onClick={() => setHasDueDate(!hasDueDate)}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  hasDueDate ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-sm text-[var(--color-pastel-text-primary)] dark:text-[var(--color-dark-text-primary)]">
              Set due date
            </span>
          </label>

          {/* Due date picker (shown when hasDueDate is true) */}
          {hasDueDate && (
            <div>
              <label className={labelClass}>Due Date</label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className={labelClass}>Priority</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTaskPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors capitalize ${
                    taskPriority === p
                      ? p === 'high'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800/40 text-red-600 dark:text-red-400'
                        : p === 'low'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-[var(--color-pastel-sidebar-active)] dark:bg-[var(--color-dark-sidebar-active)] border-[var(--color-pastel-accent)]/30 dark:border-[var(--color-dark-accent)]/30 text-[var(--color-pastel-accent)] dark:text-[var(--color-dark-accent)]'
                      : 'border-[var(--color-pastel-border)]/30 dark:border-[var(--color-dark-border-subtle)] text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)] hover:bg-[var(--color-pastel-sidebar-hover)] dark:hover:bg-[var(--color-dark-sidebar-hover)]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)]">
            This task will be added to your Kanban Board's Backlog column.
            {hasDueDate ? ' It will appear on the calendar on its due date.' : ''}
          </p>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-sm font-medium text-[var(--color-pastel-text-secondary)] dark:text-[var(--color-dark-text-secondary)] hover:bg-[var(--color-pastel-sidebar-hover)] dark:hover:bg-[var(--color-dark-sidebar-hover)] border border-[var(--color-pastel-border)]/30 dark:border-[var(--color-dark-border-subtle)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !taskTitle.trim()}
              className="flex-1 py-2 rounded-xl text-sm font-semibold bg-[var(--color-pastel-accent)] hover:bg-[var(--color-pastel-accent-hover)] dark:bg-[var(--color-dark-accent)] dark:hover:bg-[var(--color-dark-accent-hover)] text-white disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Create Task'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
