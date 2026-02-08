import { supabase } from '../../../shared/lib/supabase'
import type { Card, Column, ColumnWithCards } from '../../../shared/types/database'

export async function fetchColumnsWithCards(ownerId: string): Promise<ColumnWithCards[]> {
  const { data: columnsData, error: columnsError } = await supabase
    .from('columns')
    .select('*')
    .eq('owner_id', ownerId)
    .order('position')

  if (columnsError) throw columnsError

  if (!columnsData || columnsData.length === 0) return []

  const { data: cardsData, error: cardsError } = await supabase
    .from('cards')
    .select('*')
    .in(
      'column_id',
      columnsData.map((c) => c.id),
    )
    .order('position')

  if (cardsError) throw cardsError

  return columnsData.map((column) => ({
    ...(column as Column),
    cards: (cardsData || []).filter((card) => card.column_id === column.id) as Card[],
  }))
}

export async function createColumn(args: { ownerId: string; title: string; position: number }): Promise<Column> {
  const { data, error } = await supabase
    .from('columns')
    .insert({
      owner_id: args.ownerId,
      title: args.title,
      position: args.position,
    })
    .select()
    .single()

  if (error) throw error
  return data as Column
}

export async function deleteColumn(columnId: string): Promise<void> {
  const { error } = await supabase.from('columns').delete().eq('id', columnId)
  if (error) throw error
}

export async function createCard(args: {
  columnId: string
  title: string
  position: number
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  description?: string
}): Promise<Card> {
  const { data, error } = await supabase
    .from('cards')
    .insert({
      column_id: args.columnId,
      title: args.title,
      position: args.position,
      priority: args.priority ?? 'medium',
      due_date: args.dueDate ?? null,
      description: args.description ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as Card
}

export async function deleteCard(cardId: string): Promise<void> {
  const { error } = await supabase.from('cards').delete().eq('id', cardId)
  if (error) throw error
}

export async function updateCardLocation(args: { cardId: string; columnId: string; position: number }): Promise<void> {
  const { error } = await supabase
    .from('cards')
    .update({ column_id: args.columnId, position: args.position })
    .eq('id', args.cardId)

  if (error) throw error
}

export async function updateCardPosition(args: { cardId: string; position: number }): Promise<void> {
  const { error } = await supabase.from('cards').update({ position: args.position }).eq('id', args.cardId)
  if (error) throw error
}

export async function updateColumnPosition(args: { columnId: string; position: number }): Promise<void> {
  const { error } = await supabase.from('columns').update({ position: args.position }).eq('id', args.columnId)
  if (error) throw error
}

export async function fetchCardsWithDueDateInRange(args: {
  ownerId: string
  rangeStart: string
  rangeEnd: string
}): Promise<Card[]> {
  const { data: columns, error: colError } = await supabase
    .from('columns')
    .select('id')
    .eq('owner_id', args.ownerId)

  if (colError) throw colError
  if (!columns || columns.length === 0) return []

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .in('column_id', columns.map(c => c.id))
    .not('due_date', 'is', null)
    .gte('due_date', args.rangeStart)
    .lte('due_date', args.rangeEnd)
    .order('due_date')

  if (error) throw error
  return data as Card[]
}

export async function getOrCreateBacklogColumn(ownerId: string): Promise<Column> {
  const { data: existing, error: findError } = await supabase
    .from('columns')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('title', 'Backlog')
    .limit(1)
    .maybeSingle()

  if (findError) throw findError
  if (existing) return existing as Column

  const { count, error: countError } = await supabase
    .from('columns')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', ownerId)

  if (countError) throw countError

  const { data, error } = await supabase
    .from('columns')
    .insert({
      owner_id: ownerId,
      title: 'Backlog',
      position: count ?? 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as Column
}

