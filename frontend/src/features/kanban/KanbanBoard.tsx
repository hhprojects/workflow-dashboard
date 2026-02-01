import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import type { Card, ColumnWithCards } from '../../types/database'

type DragItem = {
  type: 'card' | 'column'
  id: string
  sourceColumnId?: string
}

export function KanbanBoard() {
  const { user, signOut } = useAuth()
  const [columns, setColumns] = useState<ColumnWithCards[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [addingColumn, setAddingColumn] = useState(false)

  // Drag state
  const [dragItem, setDragItem] = useState<DragItem | null>(null)
  const [dropTarget, setDropTarget] = useState<{ columnId: string; cardIndex: number } | null>(null)
  const [columnDropTarget, setColumnDropTarget] = useState<number | null>(null)
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null)

  async function fetchColumns() {
    setLoading(true)

    const { data: columnsData, error: columnsError } = await supabase
      .from('columns')
      .select('*')
      .eq('owner_id', user?.id)
      .order('position')

    if (columnsError) {
      setError(columnsError.message)
      setLoading(false)
      return
    }

    if (!columnsData || columnsData.length === 0) {
      setColumns([])
      setLoading(false)
      return
    }

    const { data: cardsData, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .in('column_id', columnsData.map(c => c.id))
      .order('position')

    if (cardsError) {
      setError(cardsError.message)
      setLoading(false)
      return
    }

    const columnsWithCards: ColumnWithCards[] = columnsData.map(column => ({
      ...column,
      cards: (cardsData || []).filter(card => card.column_id === column.id)
    }))

    setColumns(columnsWithCards)
    setLoading(false)
  }

  useEffect(() => {
    if (user) {
      fetchColumns()
    }
  }, [user])

  // ============ COLUMN HANDLERS ============

  async function handleAddColumn(e: React.FormEvent) {
    e.preventDefault()
    if (!newColumnTitle.trim() || !user) return

    setAddingColumn(true)
    const { data, error } = await supabase
      .from('columns')
      .insert({
        owner_id: user.id,
        title: newColumnTitle,
        position: columns.length,
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else {
      setColumns([...columns, { ...data, cards: [] }])
      setNewColumnTitle('')
    }
    setAddingColumn(false)
  }

  async function handleDeleteColumn(columnId: string) {
    if (!confirm('Delete this column and all its cards?')) return

    const { error } = await supabase
      .from('columns')
      .delete()
      .eq('id', columnId)

    if (error) {
      setError(error.message)
    } else {
      setColumns(columns.filter(c => c.id !== columnId))
    }
  }

  // ============ CARD HANDLERS ============

  async function handleAddCard(columnId: string, title: string) {
    const column = columns.find(c => c.id === columnId)
    if (!column) return

    const { data, error } = await supabase
      .from('cards')
      .insert({
        column_id: columnId,
        title,
        position: column.cards.length,
        priority: 'medium',
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else {
      setColumns(columns.map(c =>
        c.id === columnId
          ? { ...c, cards: [...c.cards, data] }
          : c
      ))
    }
  }

  async function handleDeleteCard(columnId: string, cardId: string) {
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId)

    if (error) {
      setError(error.message)
    } else {
      setColumns(columns.map(c =>
        c.id === columnId
          ? { ...c, cards: c.cards.filter(card => card.id !== cardId) }
          : c
      ))
    }
  }

  // ============ CARD DRAG & DROP ============

  function handleCardDragStart(e: React.DragEvent, cardId: string, columnId: string) {
    e.stopPropagation()
    setDragItem({ type: 'card', id: cardId, sourceColumnId: columnId })
    setDraggedElement(e.target as HTMLElement)
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = '0.5'
    }, 0)
  }

  function handleCardDragOver(e: React.DragEvent, columnId: string, cardIndex: number) {
    e.preventDefault()
    e.stopPropagation()
    if (dragItem?.type !== 'card' || !dragItem.sourceColumnId) return

    // Use midpoint - every pixel belongs to a card wrapper now (no gaps)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    const dropIndex = e.clientY < midpoint ? cardIndex : cardIndex + 1

    // Find the source card's current index
    const sourceColumn = columns.find(c => c.id === dragItem.sourceColumnId)
    const sourceIndex = sourceColumn?.cards.findIndex(c => c.id === dragItem.id) ?? -1

    // Skip if this would result in no movement (same column, same effective position)
    if (dragItem.sourceColumnId === columnId) {
      if (dropIndex === sourceIndex || dropIndex === sourceIndex + 1) {
        return // No change needed
      }
    }

    setDropTarget({ columnId, cardIndex: dropIndex })
  }

  function handleColumnBodyDragOver(e: React.DragEvent, columnId: string, totalCards: number) {
    e.preventDefault()
    e.stopPropagation()
    if (dragItem?.type !== 'card') return

    // Only set drop target to end of column
    const targetColumn = columns.find(c => c.id === columnId)
    if (!targetColumn) return

    setDropTarget({ columnId, cardIndex: totalCards })
  }

  async function handleCardDrop(e: React.DragEvent, targetColumnId: string, targetIndex: number) {
    e.preventDefault()
    e.stopPropagation()

    if (!dragItem || dragItem.type !== 'card' || !dragItem.sourceColumnId) return

    const { id: cardId, sourceColumnId } = dragItem
    const sourceColumn = columns.find(c => c.id === sourceColumnId)
    const targetColumn = columns.find(c => c.id === targetColumnId)

    if (!sourceColumn || !targetColumn) return

    const card = sourceColumn.cards.find(c => c.id === cardId)
    if (!card) return

    const sourceIndex = sourceColumn.cards.findIndex(c => c.id === cardId)

    // Calculate the actual insert index
    let insertIndex = targetIndex

    // If moving within same column, adjust index
    if (sourceColumnId === targetColumnId && sourceIndex < targetIndex) {
      insertIndex = targetIndex - 1
    }

    // If dropping in same position, do nothing
    if (sourceColumnId === targetColumnId && sourceIndex === insertIndex) {
      if (draggedElement) draggedElement.style.opacity = '1'
      setDraggedElement(null)
      setDragItem(null)
      setDropTarget(null)
      return
    }

    // Optimistic update
    const newColumns = columns.map(col => {
      if (col.id === sourceColumnId && sourceColumnId === targetColumnId) {
        // Same column reorder
        const newCards = [...col.cards]
        newCards.splice(sourceIndex, 1)
        newCards.splice(insertIndex, 0, card)
        return {
          ...col,
          cards: newCards.map((c, i) => ({ ...c, position: i }))
        }
      } else if (col.id === sourceColumnId) {
        // Remove from source
        return {
          ...col,
          cards: col.cards.filter(c => c.id !== cardId).map((c, i) => ({ ...c, position: i }))
        }
      } else if (col.id === targetColumnId) {
        // Add to target
        const newCards = [...col.cards]
        newCards.splice(insertIndex, 0, { ...card, column_id: targetColumnId })
        return {
          ...col,
          cards: newCards.map((c, i) => ({ ...c, position: i }))
        }
      }
      return col
    })

    setColumns(newColumns)
    setDragItem(null)
    setDropTarget(null)

    // Reset opacity immediately
    if (draggedElement) draggedElement.style.opacity = '1'
    setDraggedElement(null)

    // Sync to database - update the moved card
    const { error } = await supabase
      .from('cards')
      .update({ column_id: targetColumnId, position: insertIndex })
      .eq('id', cardId)

    if (error) {
      setError(error.message)
      fetchColumns()
      return
    }

    // Update positions of other affected cards in target column
    const affectedColumn = newColumns.find(c => c.id === targetColumnId)
    if (affectedColumn) {
      for (const c of affectedColumn.cards) {
        if (c.id !== cardId) {
          await supabase
            .from('cards')
            .update({ position: c.position })
            .eq('id', c.id)
        }
      }
    }

    // If moving between columns, also update source column positions
    if (sourceColumnId !== targetColumnId) {
      const sourceCol = newColumns.find(c => c.id === sourceColumnId)
      if (sourceCol) {
        for (const c of sourceCol.cards) {
          await supabase
            .from('cards')
            .update({ position: c.position })
            .eq('id', c.id)
        }
      }
    }
  }

  // ============ COLUMN DRAG & DROP ============

  function handleColumnDragStart(e: React.DragEvent, columnId: string) {
    e.stopPropagation()
    setDragItem({ type: 'column', id: columnId })
    setDraggedElement(e.target as HTMLElement)
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => {
      (e.target as HTMLElement).style.opacity = '0.5'
    }, 0)
  }

  function handleColumnDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    e.stopPropagation()
    if (dragItem?.type !== 'column') return

    const sourceIndex = columns.findIndex(c => c.id === dragItem.id)
    if (sourceIndex === -1) return

    let dropIndex = index
    if (sourceIndex < index) {
      dropIndex = index - 1
    }

    setColumnDropTarget(dropIndex)
  }

  async function handleColumnDrop(e: React.DragEvent, targetIndex: number) {
    e.preventDefault()
    e.stopPropagation()

    if (!dragItem || dragItem.type !== 'column') return

    const sourceIndex = columns.findIndex(c => c.id === dragItem.id)
    if (sourceIndex === -1 || sourceIndex === targetIndex) {
      if (draggedElement) draggedElement.style.opacity = '1'
      setDraggedElement(null)
      setDragItem(null)
      setColumnDropTarget(null)
      return
    }

    // Optimistic update - use targetIndex directly (no adjustment needed)
    const newColumns = [...columns]
    const [movedColumn] = newColumns.splice(sourceIndex, 1)
    newColumns.splice(targetIndex, 0, movedColumn)

    // Update positions
    const updatedColumns = newColumns.map((c, i) => ({ ...c, position: i }))
    setColumns(updatedColumns)
    setDragItem(null)
    setColumnDropTarget(null)

    // Reset opacity immediately
    if (draggedElement) draggedElement.style.opacity = '1'
    setDraggedElement(null)

    // Sync to database
    for (const col of updatedColumns) {
      const { error } = await supabase
        .from('columns')
        .update({ position: col.position })
        .eq('id', col.id)

      if (error) {
        setError(error.message)
        fetchColumns()
        break
      }
    }
  }

  // ============ RENDER ============

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-full mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Board</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={signOut}
              className="text-gray-600 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Error display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
            <button onClick={() => setError(null)} className="float-right">&times;</button>
          </div>
        </div>
      )}

      {/* Kanban board */}
      <main className="p-4 overflow-x-auto">
        <div className="flex gap-4 items-start">
          {columns.map((column, colIndex) => (
            <div
              key={column.id}
              className={`bg-gray-200 rounded-lg p-3 w-72 flex-shrink-0 transition-all ${
                columnDropTarget === colIndex && dragItem?.type === 'column'
                  ? 'ring-2 ring-blue-500 ring-offset-2'
                  : ''
              }`}
              draggable
              onDragStart={(e) => handleColumnDragStart(e, column.id)}
              onDragOver={(e) => {
                handleColumnDragOver(e, colIndex)
                handleColumnBodyDragOver(e, column.id, column.cards.length)
              }}
              onDrop={(e) => {
                if (dragItem?.type === 'column') {
                  handleColumnDrop(e, colIndex)
                } else if (dragItem?.type === 'card') {
                  handleCardDrop(e, column.id, dropTarget?.cardIndex ?? column.cards.length)
                }
              }}
            >
              {/* Column header - drag handle */}
              <div className="flex justify-between items-center mb-3 cursor-grab active:cursor-grabbing">
                <h3 className="font-semibold text-gray-700">{column.title}</h3>
                <button
                  onClick={() => handleDeleteColumn(column.id)}
                  className="text-gray-400 hover:text-red-500"
                  draggable={false}
                >
                  &times;
                </button>
              </div>

              {/* Cards - no gap, each card wrapper owns its spacing */}
              <div className="min-h-[20px]">
                {column.cards.map((card, cardIndex) => {
                  const showDropBefore =
                    dropTarget?.columnId === column.id &&
                    dropTarget?.cardIndex === cardIndex &&
                    dragItem?.type === 'card' &&
                    dragItem.id !== card.id

                  return (
                    // Wrapper owns all space including bottom margin area
                    <div
                      key={card.id}
                      className="pb-2 last:pb-0"
                      onDragOver={(e) => handleCardDragOver(e, column.id, cardIndex)}
                    >
                      {/* Drop indicator above card */}
                      {showDropBefore && (
                        <div className="h-1 bg-blue-500 rounded mb-2" />
                      )}
                      <div
                        className={`bg-white rounded p-3 shadow-sm hover:shadow cursor-grab active:cursor-grabbing ${
                          dragItem?.type === 'card' && dragItem.id === card.id
                            ? 'opacity-50'
                            : ''
                        }`}
                        draggable
                        onDragStart={(e) => handleCardDragStart(e, card.id, column.id)}
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-gray-800">{card.title}</p>
                          <button
                            onClick={() => handleDeleteCard(column.id, card.id)}
                            className="text-gray-400 hover:text-red-500 text-sm"
                            draggable={false}
                          >
                            &times;
                          </button>
                        </div>
                        {card.priority !== 'medium' && (
                          <span className={`text-xs px-2 py-0.5 rounded mt-2 inline-block ${
                            card.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {card.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Drop indicator at end of column */}
                {dropTarget?.columnId === column.id &&
                 dropTarget?.cardIndex === column.cards.length &&
                 dragItem?.type === 'card' && (
                  <div className="h-1 bg-blue-500 rounded mt-2" />
                )}
              </div>

              {/* Add card form */}
              <AddCardForm onAdd={(title) => handleAddCard(column.id, title)} />
            </div>
          ))}

          {/* Add column form */}
          <div className="bg-gray-200/50 rounded-lg p-3 w-72 flex-shrink-0">
            <form onSubmit={handleAddColumn}>
              <input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="+ Add column"
                className="w-full px-3 py-2 rounded border-0 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {newColumnTitle && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={addingColumn}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewColumnTitle('')}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

// Separate component for adding cards
function AddCardForm({ onAdd }: { onAdd: (title: string) => void }) {
  const [title, setTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd(title)
    setTitle('')
    setIsAdding(false)
  }

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full text-left text-gray-500 hover:text-gray-700 mt-2 px-2 py-1 rounded hover:bg-gray-300/50"
        draggable={false}
      >
        + Add card
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2" draggable={false}>
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter card title..."
        className="w-full px-3 py-2 rounded border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        rows={2}
        autoFocus
      />
      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => { setIsAdding(false); setTitle('') }}
          className="px-3 py-1 text-gray-600 hover:bg-gray-300 rounded text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
