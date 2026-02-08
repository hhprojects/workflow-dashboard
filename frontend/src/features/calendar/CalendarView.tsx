import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth'
import type { CalendarEvent, Card, EventColor } from '../../shared/types/database'
import { fetchEventsForRange, createEvent, updateEvent, deleteEvent } from './services/calendar.service'
import { createCard, fetchCardsWithDueDateInRange, getOrCreateBacklogColumn } from '../kanban/services/kanban.service'
import { buildCalendarGrid, getGridDateRange } from './utils/calendar.utils'
import { CalendarHeader } from './components/CalendarHeader'
import { CalendarGrid } from './components/CalendarGrid'
import { EventFormModal } from './components/EventFormModal'

type ModalState =
  | { open: false }
  | { open: true; prefilledDate: string; defaultTab: 'event' | 'task'; editingEvent?: CalendarEvent | null }

export function CalendarView() {
  const { user } = useAuth()
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalState, setModalState] = useState<ModalState>({ open: false })

  const days = buildCalendarGrid(currentYear, currentMonth)

  const fetchData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const { rangeStart, rangeEnd } = getGridDateRange(currentYear, currentMonth)

      const [eventsData, tasksData] = await Promise.all([
        fetchEventsForRange({ ownerId: user.id, rangeStart, rangeEnd }),
        fetchCardsWithDueDateInRange({ ownerId: user.id, rangeStart, rangeEnd }),
      ])

      setEvents(eventsData)
      setTasks(tasksData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load calendar data')
    } finally {
      setLoading(false)
    }
  }, [user, currentYear, currentMonth])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Navigation
  function goToPreviousMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  function goToToday() {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth())
  }

  // Modal handlers
  function openNewEvent() {
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    setModalState({ open: true, prefilledDate: todayStr, defaultTab: 'event' })
  }

  function openDayClick(fullDate: string) {
    setModalState({ open: true, prefilledDate: fullDate, defaultTab: 'event' })
  }

  function openEditEvent(event: CalendarEvent) {
    setModalState({ open: true, prefilledDate: event.start_date, defaultTab: 'event', editingEvent: event })
  }

  function closeModal() {
    setModalState({ open: false })
  }

  // CRUD handlers
  async function handleCreateEvent(data: {
    title: string
    description: string
    startDate: string
    endDate: string
    isAllDay: boolean
    startTime: string
    endTime: string
    color: EventColor
  }) {
    if (!user) return

    await createEvent({
      ownerId: user.id,
      title: data.title,
      description: data.description || undefined,
      startDate: data.startDate,
      endDate: data.endDate,
      isAllDay: data.isAllDay,
      startTime: data.startTime || undefined,
      endTime: data.endTime || undefined,
      color: data.color,
    })

    await fetchData()
  }

  async function handleUpdateEvent(data: {
    eventId: string
    title: string
    description: string
    startDate: string
    endDate: string
    isAllDay: boolean
    startTime: string
    endTime: string
    color: EventColor
  }) {
    await updateEvent({
      eventId: data.eventId,
      title: data.title,
      description: data.description || undefined,
      startDate: data.startDate,
      endDate: data.endDate,
      isAllDay: data.isAllDay,
      startTime: data.startTime || undefined,
      endTime: data.endTime || undefined,
      color: data.color,
    })

    await fetchData()
  }

  async function handleDeleteEvent(eventId: string) {
    try {
      await deleteEvent(eventId)
      await fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete event')
    }
  }

  async function handleMoveEvent(event: CalendarEvent, newStartDate: string, newEndDate: string) {
    try {
      await updateEvent({
        eventId: event.id,
        title: event.title,
        description: event.description || undefined,
        startDate: newStartDate,
        endDate: newEndDate,
        isAllDay: event.is_all_day,
        startTime: event.start_time?.slice(0, 5) || undefined,
        endTime: event.end_time?.slice(0, 5) || undefined,
        color: event.color,
      })
      await fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to move event')
    }
  }

  async function handleCreateTask(data: {
    title: string
    description: string
    dueDate: string | null
    priority: 'low' | 'medium' | 'high'
  }) {
    if (!user) return

    const backlogColumn = await getOrCreateBacklogColumn(user.id)

    // Count existing cards in backlog to determine position
    const { rangeStart, rangeEnd } = getGridDateRange(currentYear, currentMonth)
    const allTasks = await fetchCardsWithDueDateInRange({ ownerId: user.id, rangeStart, rangeEnd })
    const backlogCards = allTasks.filter((c) => c.column_id === backlogColumn.id)

    await createCard({
      columnId: backlogColumn.id,
      title: data.title,
      position: backlogCards.length,
      priority: data.priority,
      dueDate: data.dueDate ?? undefined,
      description: data.description || undefined,
    })

    await fetchData()
  }

  if (loading && events.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[var(--color-pastel-accent)] dark:border-[var(--color-dark-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)]">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Error display */}
      {error && (
        <div className="mb-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
            <button onClick={() => setError(null)} className="float-right font-medium hover:text-red-800 dark:hover:text-red-300">&times;</button>
          </div>
        </div>
      )}

      <CalendarHeader
        currentMonth={currentMonth}
        currentYear={currentYear}
        onPrev={goToPreviousMonth}
        onNext={goToNextMonth}
        onToday={goToToday}
        onNewEvent={openNewEvent}
      />

      <CalendarGrid
        days={days}
        events={events}
        tasks={tasks}
        onDayClick={openDayClick}
        onDeleteEvent={handleDeleteEvent}
        onClickEvent={openEditEvent}
        onMoveEvent={handleMoveEvent}
      />

      {modalState.open && (
        <EventFormModal
          isOpen
          onClose={closeModal}
          prefilledDate={modalState.prefilledDate}
          defaultTab={modalState.defaultTab}
          editingEvent={modalState.editingEvent}
          onCreateEvent={handleCreateEvent}
          onUpdateEvent={handleUpdateEvent}
          onCreateTask={handleCreateTask}
        />
      )}
    </div>
  )
}
