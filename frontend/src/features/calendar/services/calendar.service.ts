import { supabase } from '../../../shared/lib/supabase'
import type { CalendarEvent, EventColor } from '../../../shared/types/database'

export async function fetchEventsForRange(args: {
  ownerId: string
  rangeStart: string
  rangeEnd: string
}): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('owner_id', args.ownerId)
    .lte('start_date', args.rangeEnd)
    .gte('end_date', args.rangeStart)
    .order('start_date')

  if (error) throw error
  return data as CalendarEvent[]
}

export async function createEvent(args: {
  ownerId: string
  title: string
  description?: string
  startDate: string
  endDate: string
  isAllDay: boolean
  startTime?: string
  endTime?: string
  color: EventColor
}): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      owner_id: args.ownerId,
      title: args.title,
      description: args.description ?? null,
      start_date: args.startDate,
      end_date: args.endDate,
      is_all_day: args.isAllDay,
      start_time: args.isAllDay ? null : (args.startTime ?? null),
      end_time: args.isAllDay ? null : (args.endTime ?? null),
      color: args.color,
    })
    .select()
    .single()

  if (error) throw error
  return data as CalendarEvent
}

export async function updateEvent(args: {
  eventId: string
  title: string
  description?: string
  startDate: string
  endDate: string
  isAllDay: boolean
  startTime?: string
  endTime?: string
  color: EventColor
}): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('calendar_events')
    .update({
      title: args.title,
      description: args.description ?? null,
      start_date: args.startDate,
      end_date: args.endDate,
      is_all_day: args.isAllDay,
      start_time: args.isAllDay ? null : (args.startTime ?? null),
      end_time: args.isAllDay ? null : (args.endTime ?? null),
      color: args.color,
    })
    .eq('id', args.eventId)
    .select()
    .single()

  if (error) throw error
  return data as CalendarEvent
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId)

  if (error) throw error
}
