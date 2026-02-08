import { useState } from 'react'
import type { CalendarEvent, Card } from '../../../shared/types/database'
import { computeRowLayouts, DAYS_OF_WEEK, type CalendarDay, type EventPlacement } from '../utils/calendar.utils'
import { CalendarDayCell, type EventLaneItem } from './CalendarDayCell'

type Props = {
  days: CalendarDay[]
  events: CalendarEvent[]
  tasks: Card[]
  onDayClick: (fullDate: string) => void
  onDeleteEvent: (id: string) => void
  onClickEvent: (event: CalendarEvent) => void
  onMoveEvent: (event: CalendarEvent, newStartDate: string, newEndDate: string) => void
}

function shiftDate(dateStr: string, deltaDays: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + deltaDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysDiff(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00')
  const b = new Date(to + 'T00:00:00')
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function buildLanesForCell(
  colIndex: number,
  visibleLanes: number,
  placements: EventPlacement[]
): (EventLaneItem | null)[] {
  const lanes: (EventLaneItem | null)[] = []
  for (let lane = 0; lane < visibleLanes; lane++) {
    const placement = placements.find(
      (p) =>
        p.lane === lane &&
        colIndex >= p.startCol &&
        colIndex < p.startCol + p.spanCols
    )
    if (!placement) {
      lanes.push(null)
      continue
    }

    const isFirstCellOfSegment = placement.startCol === colIndex
    const isLastCellOfSegment = placement.startCol + placement.spanCols - 1 === colIndex

    lanes.push({
      event: placement.event,
      showTitle: isFirstCellOfSegment,
      roundLeft: isFirstCellOfSegment && placement.isStart,
      roundRight: isLastCellOfSegment && placement.isEnd,
    })
  }
  return lanes
}

export function CalendarGrid({ days, events, tasks, onDayClick, onDeleteEvent, onClickEvent, onMoveEvent }: Props) {
  const rowLayouts = computeRowLayouts(days, events)

  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null)

  function handleEventDragStart(event: CalendarEvent) {
    setDraggedEvent(event)
  }

  function handleDragOverCell(e: React.DragEvent, fullDate: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dropTargetDate !== fullDate) setDropTargetDate(fullDate)
  }

  function handleDropOnCell(fullDate: string) {
    if (!draggedEvent) return
    const delta = daysDiff(draggedEvent.start_date, fullDate)
    if (delta !== 0) {
      onMoveEvent(draggedEvent, shiftDate(draggedEvent.start_date, delta), shiftDate(draggedEvent.end_date, delta))
    }
    setDraggedEvent(null)
    setDropTargetDate(null)
  }

  function handleDragEnd() {
    setDraggedEvent(null)
    setDropTargetDate(null)
  }

  return (
    <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-[var(--color-pastel-border)]/30 dark:border-[var(--color-dark-border-subtle)] bg-[var(--color-pastel-column)] dark:bg-[var(--color-dark-column)]">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-[var(--color-pastel-border)]/30 dark:border-[var(--color-dark-border-subtle)]">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar rows */}
      <div className="flex-1 flex flex-col">
        {rowLayouts.map((row, rowIndex) => {
          const visibleLanes = Math.min(row.maxLanes, 3)

          return (
            <div key={rowIndex} className="flex-1 grid grid-cols-7" style={{ minHeight: '96px' }}>
              {row.days.map((day, colIndex) => {
                const dayTasks = tasks.filter((t) => t.due_date?.slice(0, 10) === day.fullDate)
                const eventLanes = buildLanesForCell(colIndex, visibleLanes, row.eventPlacements)
                const isDropTarget = draggedEvent !== null && dropTargetDate === day.fullDate

                // Count overflow events beyond 3 lanes
                const overflowCount = row.eventPlacements.filter(
                  (p) =>
                    p.lane >= 3 &&
                    colIndex >= p.startCol &&
                    colIndex < p.startCol + p.spanCols
                ).length

                return (
                  <CalendarDayCell
                    key={day.fullDate}
                    day={day}
                    tasks={dayTasks}
                    eventLanes={eventLanes}
                    overflowCount={overflowCount}
                    isDropTarget={isDropTarget}
                    onClick={onDayClick}
                    onDragOver={(e) => handleDragOverCell(e, day.fullDate)}
                    onDrop={() => handleDropOnCell(day.fullDate)}
                    onDeleteEvent={onDeleteEvent}
                    onClickEvent={onClickEvent}
                    onDragStartEvent={handleEventDragStart}
                    onDragEndEvent={handleDragEnd}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
