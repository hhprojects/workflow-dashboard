import type { CalendarEvent } from '../../../shared/types/database'
import { EVENT_COLORS } from '../utils/calendar.utils'

type Props = {
  event: CalendarEvent
  showTitle: boolean
  roundLeft: boolean
  roundRight: boolean
  onDelete: (id: string) => void
  onClick: (event: CalendarEvent) => void
  onDragStart: (event: CalendarEvent) => void
  onDragEnd: () => void
}

export function CalendarEventBar({ event, showTitle, roundLeft, roundRight, onDelete, onClick, onDragStart, onDragEnd }: Props) {
  const colorClass = EVENT_COLORS[event.color] ?? EVENT_COLORS.pink

  const roundedClass =
    roundLeft && roundRight
      ? 'rounded-md'
      : roundLeft
      ? 'rounded-l-md'
      : roundRight
      ? 'rounded-r-md'
      : ''

  const timeStr =
    !event.is_all_day && event.start_time
      ? event.start_time.slice(0, 5) + ' '
      : ''

  return (
    <div
      className={`group relative h-[22px] px-1.5 flex items-center text-[11px] font-medium text-white cursor-grab active:cursor-grabbing select-none overflow-hidden ${colorClass} ${roundedClass} hover:brightness-110 transition-all`}
      draggable
      onDragStart={(e) => {
        e.stopPropagation()
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(event)
        ;(e.currentTarget as HTMLElement).style.opacity = '0.4'
      }}
      onDragEnd={(e) => {
        ;(e.currentTarget as HTMLElement).style.opacity = '1'
        onDragEnd()
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick(event)
      }}
    >
      {showTitle && (
        <span className="truncate">
          {timeStr}{event.title}
        </span>
      )}

      {roundRight && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(event.id)
          }}
          className="absolute right-0.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded text-white/0 group-hover:text-white/90 hover:bg-white/20 transition-all"
          draggable={false}
        >
          &times;
        </button>
      )}
    </div>
  )
}
