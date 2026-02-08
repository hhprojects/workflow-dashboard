import type { CalendarEvent, EventColor } from '../../../shared/types/database'

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export type CalendarDay = {
  date: number
  fullDate: string      // 'YYYY-MM-DD'
  month: 'prev' | 'current' | 'next'
  isToday: boolean
  isWeekend: boolean
}

export type EventPlacement = {
  event: CalendarEvent
  lane: number
  startCol: number
  spanCols: number
  isStart: boolean
  isEnd: boolean
}

export type RowLayout = {
  days: CalendarDay[]
  eventPlacements: EventPlacement[]
  maxLanes: number
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function buildCalendarGrid(year: number, month: number): CalendarDay[] {
  const today = new Date()
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const daysInPrevMonth = getDaysInMonth(year, month - 1)

  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year

  const days: CalendarDay[] = []

  // Previous month overflow
  for (let i = firstDay - 1; i >= 0; i--) {
    const date = daysInPrevMonth - i
    const fullDate = toDateStr(prevYear, prevMonth, date)
    const dayOfWeek = days.length % 7
    days.push({
      date,
      fullDate,
      month: 'prev',
      isToday: fullDate === todayStr,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const fullDate = toDateStr(year, month, d)
    const dayOfWeek = days.length % 7
    days.push({
      date: d,
      fullDate,
      month: 'current',
      isToday: fullDate === todayStr,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    })
  }

  // Next month overflow to fill 42 cells (6 rows)
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const fullDate = toDateStr(nextYear, nextMonth, d)
    const dayOfWeek = days.length % 7
    days.push({
      date: d,
      fullDate,
      month: 'next',
      isToday: fullDate === todayStr,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    })
  }

  return days
}

export function computeRowLayouts(
  days: CalendarDay[],
  events: CalendarEvent[]
): RowLayout[] {
  const rows: RowLayout[] = []

  for (let row = 0; row < 6; row++) {
    const rowDays = days.slice(row * 7, row * 7 + 7)
    const rowStart = rowDays[0].fullDate
    const rowEnd = rowDays[6].fullDate

    // Find events that overlap with this row
    const rowEvents = events.filter(
      (e) => e.start_date <= rowEnd && e.end_date >= rowStart
    )

    // Sort: longer events first, then by start date
    rowEvents.sort((a, b) => {
      const aDays = daysBetween(a.start_date, a.end_date)
      const bDays = daysBetween(b.start_date, b.end_date)
      if (bDays !== aDays) return bDays - aDays
      return a.start_date.localeCompare(b.start_date)
    })

    const placements: EventPlacement[] = []
    // Track which columns are occupied per lane
    const laneOccupancy: boolean[][] = []

    for (const event of rowEvents) {
      // Clip event to row boundaries
      const clippedStart = event.start_date < rowStart ? rowStart : event.start_date
      const clippedEnd = event.end_date > rowEnd ? rowEnd : event.end_date

      const startCol = rowDays.findIndex((d) => d.fullDate === clippedStart)
      const endCol = rowDays.findIndex((d) => d.fullDate === clippedEnd)
      if (startCol === -1 || endCol === -1) continue

      const spanCols = endCol - startCol + 1

      // Find the first available lane
      let lane = 0
      while (true) {
        if (!laneOccupancy[lane]) {
          laneOccupancy[lane] = Array(7).fill(false)
        }
        let fits = true
        for (let c = startCol; c <= endCol; c++) {
          if (laneOccupancy[lane][c]) {
            fits = false
            break
          }
        }
        if (fits) break
        lane++
      }

      // Mark columns as occupied in this lane
      if (!laneOccupancy[lane]) {
        laneOccupancy[lane] = Array(7).fill(false)
      }
      for (let c = startCol; c <= endCol; c++) {
        laneOccupancy[lane][c] = true
      }

      placements.push({
        event,
        lane,
        startCol,
        spanCols,
        isStart: event.start_date >= rowStart,
        isEnd: event.end_date <= rowEnd,
      })
    }

    rows.push({
      days: rowDays,
      eventPlacements: placements,
      maxLanes: laneOccupancy.length,
    })
  }

  return rows
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start)
  const e = new Date(end)
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
}

export const EVENT_COLORS: Record<EventColor, string> = {
  pink: 'bg-pink-400',
  blue: 'bg-blue-400',
  purple: 'bg-purple-400',
  green: 'bg-emerald-400',
  orange: 'bg-orange-400',
  red: 'bg-red-400',
}

export const EVENT_COLOR_VALUES: Record<EventColor, string> = {
  pink: '#F472B6',
  blue: '#60A5FA',
  purple: '#A78BFA',
  green: '#34D399',
  orange: '#FB923C',
  red: '#F87171',
}

export function getGridDateRange(year: number, month: number) {
  const grid = buildCalendarGrid(year, month)
  return {
    rangeStart: grid[0].fullDate,
    rangeEnd: grid[41].fullDate,
  }
}
