// Database types matching your Supabase schema

export type Column = {
  id: string
  owner_id: string
  title: string
  position: number
  created_at: string
}

export type Card = {
  id: string
  column_id: string
  title: string
  description: string | null
  position: number
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  created_at: string
  updated_at: string
}

export type ColumnWithCards = Column & { cards: Card[] }

export type EventColor = 'pink' | 'blue' | 'purple' | 'green' | 'orange' | 'red'

export type CalendarEvent = {
  id: string
  owner_id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  is_all_day: boolean
  start_time: string | null
  end_time: string | null
  color: EventColor
  created_at: string
  updated_at: string
}

export type CalendarItem =
  | { type: 'event'; data: CalendarEvent }
  | { type: 'task'; data: Card }

