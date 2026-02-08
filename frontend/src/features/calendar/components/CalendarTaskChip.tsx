import type { Card } from '../../../shared/types/database'

type Props = {
  task: Card
}

export function CalendarTaskChip({ task }: Props) {
  const priorityDot =
    task.priority === 'high'
      ? 'bg-red-400'
      : task.priority === 'low'
      ? 'bg-emerald-400'
      : 'bg-[var(--color-pastel-accent)] dark:bg-[var(--color-dark-accent)]'

  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5 text-[11px] text-[var(--color-pastel-text-primary)] dark:text-[var(--color-dark-text-primary)] rounded hover:bg-[var(--color-pastel-sidebar-hover)] dark:hover:bg-[var(--color-dark-sidebar-hover)] cursor-default truncate">
      {/* Checkbox icon */}
      <div className={`w-2.5 h-2.5 rounded-sm border-2 border-current flex-shrink-0 flex items-center justify-center ${priorityDot.includes('bg-') ? '' : ''}`}>
        <div className={`w-1.5 h-1.5 rounded-[1px] ${priorityDot}`} />
      </div>
      <span className="truncate">{task.title}</span>
    </div>
  )
}
