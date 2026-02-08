import type { CalendarEvent, Card } from '../../../shared/types/database'
import type { CalendarDay } from '../utils/calendar.utils'
import { CalendarTaskChip } from './CalendarTaskChip'
import { CalendarEventBar } from './CalendarEventBar'

export type EventLaneItem = {
  event: CalendarEvent
  showTitle: boolean
  roundLeft: boolean
  roundRight: boolean
}

type Props = {
  day: CalendarDay
  tasks: Card[]
  eventLanes: (EventLaneItem | null)[]
  overflowCount: number
  isDropTarget: boolean
  onClick: (fullDate: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDeleteEvent: (id: string) => void
  onClickEvent: (event: CalendarEvent) => void
  onDragStartEvent: (event: CalendarEvent) => void
  onDragEndEvent: () => void
}

export function CalendarDayCell({
  day,
  tasks,
  eventLanes,
  overflowCount,
  isDropTarget,
  onClick,
  onDragOver,
  onDrop,
  onDeleteEvent,
  onClickEvent,
  onDragStartEvent,
  onDragEndEvent,
}: Props) {
  return (
    <div
      className={`flex border-r border-b border-[var(--color-pastel-border)]/20 dark:border-[var(--color-dark-border-subtle)] cursor-pointer transition-colors overflow-hidden ${
        day.month !== 'current'
          ? 'bg-[var(--color-pastel-bg)]/30 dark:bg-[var(--color-dark-bg)]/50'
          : day.isWeekend
          ? 'bg-[var(--color-pastel-bg)]/40 dark:bg-[var(--color-dark-bg)]/20'
          : 'hover:bg-[var(--color-pastel-sidebar-hover)] dark:hover:bg-[var(--color-dark-sidebar-hover)]'
      } ${
        isDropTarget
          ? 'bg-[var(--color-pastel-accent)]/10 dark:bg-[var(--color-dark-accent)]/10 ring-1 ring-inset ring-[var(--color-pastel-accent)]/40 dark:ring-[var(--color-dark-accent)]/40'
          : ''
      }`}
      onClick={() => onClick(day.fullDate)}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault()
        onDrop()
      }}
    >
      {/* Left: Date number */}
      <div className="w-9 flex-shrink-0 pt-2 flex justify-center">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm ${
            day.isToday
              ? 'bg-[var(--color-pastel-accent)] dark:bg-[var(--color-dark-accent)] text-white font-bold'
              : day.month === 'current'
              ? 'text-[var(--color-pastel-text-primary)] dark:text-[var(--color-dark-text-primary)] font-medium'
              : 'text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)]'
          }`}
        >
          {day.date}
        </span>
      </div>

      {/* Right: Content area */}
      <div className="flex-1 min-w-0 pt-1.5 pb-1 flex flex-col">
        {/* Tasks (above events) */}
        {tasks.length > 0 && (
          <div className="px-1 space-y-0.5">
            {tasks.slice(0, 2).map((task) => (
              <CalendarTaskChip key={task.id} task={task} />
            ))}
            {tasks.length > 2 && (
              <div className="text-[10px] text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)] px-1 font-medium">
                +{tasks.length - 2} more
              </div>
            )}
          </div>
        )}

        {/* Event lanes */}
        {eventLanes.length > 0 && (
          <div className={`space-y-[2px] ${tasks.length > 0 ? 'mt-1' : ''}`}>
            {eventLanes.map((lane, i) => {
              if (!lane) {
                return <div key={i} className="h-[22px]" />
              }
              return (
                <div key={lane.event.id + '-' + i} className="pr-[1px]">
                  <CalendarEventBar
                    event={lane.event}
                    showTitle={lane.showTitle}
                    roundLeft={lane.roundLeft}
                    roundRight={lane.roundRight}
                    onDelete={onDeleteEvent}
                    onClick={onClickEvent}
                    onDragStart={onDragStartEvent}
                    onDragEnd={onDragEndEvent}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* Overflow indicator */}
        {overflowCount > 0 && (
          <div className="text-[10px] text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)] px-1 font-medium mt-0.5">
            +{overflowCount} more
          </div>
        )}
      </div>
    </div>
  )
}
