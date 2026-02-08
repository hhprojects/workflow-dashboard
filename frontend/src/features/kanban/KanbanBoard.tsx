import { useEffect, useState } from 'react'
import { useAuth } from '../auth'
import type { ColumnWithCards } from '../../shared/types/database'
import {
  createCard,
  createColumn,
  deleteCard,
  deleteColumn,
  fetchColumnsWithCards,
  updateCardLocation,
  updateCardPosition,
  updateColumnPosition,
} from './services/kanban.service'

type DragItem = {
  type: 'card' | 'column'
  id: string
  sourceColumnId?: string
}

export function KanbanBoard() {
  const { user } = useAuth()
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
    if (!user) return

    try {
      const columnsWithCards = await fetchColumnsWithCards(user.id)
      setColumns(columnsWithCards)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load board')
    } finally {
      setLoading(false)
    }
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
    try {
      const data = await createColumn({ ownerId: user.id, title: newColumnTitle, position: columns.length })
      setColumns([...columns, { ...data, cards: [] }])
      setNewColumnTitle('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create column')
    }
    setAddingColumn(false)
  }

  async function handleDeleteColumn(columnId: string) {
    if (!confirm('Delete this column and all its cards?')) return

    try {
      await deleteColumn(columnId)
      setColumns(columns.filter(c => c.id !== columnId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete column')
    }
  }

  // ============ CARD HANDLERS ============

  async function handleAddCard(columnId: string, title: string) {
    const column = columns.find(c => c.id === columnId)
    if (!column) return

    try {
      const data = await createCard({ columnId, title, position: column.cards.length })
      setColumns(columns.map(c =>
        c.id === columnId
          ? { ...c, cards: [...c.cards, data] }
          : c
      ))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create card')
    }
  }

  async function handleDeleteCard(columnId: string, cardId: string) {
    try {
      await deleteCard(cardId)
      setColumns(columns.map(c =>
        c.id === columnId
          ? { ...c, cards: c.cards.filter(card => card.id !== cardId) }
          : c
      ))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete card')
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

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    const dropIndex = e.clientY < midpoint ? cardIndex : cardIndex + 1

    const sourceColumn = columns.find(c => c.id === dragItem.sourceColumnId)
    const sourceIndex = sourceColumn?.cards.findIndex(c => c.id === dragItem.id) ?? -1

    if (dragItem.sourceColumnId === columnId) {
      if (dropIndex === sourceIndex || dropIndex === sourceIndex + 1) {
        return
      }
    }

    setDropTarget({ columnId, cardIndex: dropIndex })
  }

  function handleColumnBodyDragOver(e: React.DragEvent, columnId: string, totalCards: number) {
    e.preventDefault()
    e.stopPropagation()
    if (dragItem?.type !== 'card') return

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

    let insertIndex = targetIndex

    if (sourceColumnId === targetColumnId && sourceIndex < targetIndex) {
      insertIndex = targetIndex - 1
    }

    if (sourceColumnId === targetColumnId && sourceIndex === insertIndex) {
      if (draggedElement) draggedElement.style.opacity = '1'
      setDraggedElement(null)
      setDragItem(null)
      setDropTarget(null)
      return
    }

    const newColumns = columns.map(col => {
      if (col.id === sourceColumnId && sourceColumnId === targetColumnId) {
        const newCards = [...col.cards]
        newCards.splice(sourceIndex, 1)
        newCards.splice(insertIndex, 0, card)
        return {
          ...col,
          cards: newCards.map((c, i) => ({ ...c, position: i }))
        }
      } else if (col.id === sourceColumnId) {
        return {
          ...col,
          cards: col.cards.filter(c => c.id !== cardId).map((c, i) => ({ ...c, position: i }))
        }
      } else if (col.id === targetColumnId) {
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

    if (draggedElement) draggedElement.style.opacity = '1'
    setDraggedElement(null)

    try {
      await updateCardLocation({ cardId, columnId: targetColumnId, position: insertIndex })

      const affectedColumn = newColumns.find((c) => c.id === targetColumnId)
      if (affectedColumn) {
        for (const c of affectedColumn.cards) {
          if (c.id !== cardId) {
            await updateCardPosition({ cardId: c.id, position: c.position })
          }
        }
      }

      if (sourceColumnId !== targetColumnId) {
        const sourceCol = newColumns.find((c) => c.id === sourceColumnId)
        if (sourceCol) {
          for (const c of sourceCol.cards) {
            await updateCardPosition({ cardId: c.id, position: c.position })
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to move card')
      fetchColumns()
      return
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

    if (sourceIndex === index) return

    setColumnDropTarget(index)
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

    const newColumns = [...columns]
    const [movedColumn] = newColumns.splice(sourceIndex, 1)
    newColumns.splice(targetIndex, 0, movedColumn)

    const updatedColumns = newColumns.map((c, i) => ({ ...c, position: i }))
    setColumns(updatedColumns)
    setDragItem(null)
    setColumnDropTarget(null)

    if (draggedElement) draggedElement.style.opacity = '1'
    setDraggedElement(null)

    for (const col of updatedColumns) {
      try {
        await updateColumnPosition({ columnId: col.id, position: col.position })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to move column')
        fetchColumns()
        break
      }
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[var(--color-pastel-accent)] dark:border-[var(--color-dark-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)]">Loading board...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Board header */}
      <div className="px-6 py-5 border-b border-[var(--color-pastel-border)]/30 dark:border-[var(--color-dark-border-subtle)]">
        <h2 className="text-2xl font-bold text-[var(--color-pastel-text-primary)] dark:text-[var(--color-dark-text-primary)]">
          My Board
        </h2>
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-6 mt-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
            <button onClick={() => setError(null)} className="float-right font-medium hover:text-red-800 dark:hover:text-red-300">&times;</button>
          </div>
        </div>
      )}

      {/* Kanban board */}
      <div className="flex-1 p-6 overflow-x-auto">
        <div className="flex gap-4 items-start h-full">
          {columns.map((column, colIndex) => (
            <div
              key={column.id}
              className={`rounded-2xl p-4 w-72 flex-shrink-0 border transition-shadow ${
                columnDropTarget === colIndex && dragItem?.type === 'column'
                  ? 'ring-2 ring-[var(--color-pastel-accent)] dark:ring-[var(--color-dark-accent)] ring-offset-2 ring-offset-[var(--color-pastel-bg)] dark:ring-offset-[var(--color-dark-bg)]'
                  : ''
              } bg-[var(--color-pastel-column)] dark:bg-[var(--color-dark-column)] border-[var(--color-pastel-border)]/20 dark:border-[var(--color-dark-border-subtle)] shadow-pastel dark:shadow-none`}
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
              {/* Column header */}
              <div className="flex justify-between items-center mb-3 cursor-grab active:cursor-grabbing">
                <h3 className="font-semibold text-sm text-[var(--color-pastel-text-primary)] dark:text-[var(--color-dark-text-primary)]">
                  {column.title}
                  <span className="ml-2 text-xs font-normal text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)]">
                    {column.cards.length}
                  </span>
                </h3>
                <button
                  onClick={() => handleDeleteColumn(column.id)}
                  className="text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)] hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  draggable={false}
                >
                  &times;
                </button>
              </div>

              {/* Cards */}
              <div className="min-h-[20px]">
                {column.cards.map((card, cardIndex) => {
                  const showDropBefore =
                    dropTarget?.columnId === column.id &&
                    dropTarget?.cardIndex === cardIndex &&
                    dragItem?.type === 'card' &&
                    dragItem.id !== card.id

                  return (
                    <div
                      key={card.id}
                      className="pb-2 last:pb-0"
                      onDragOver={(e) => handleCardDragOver(e, column.id, cardIndex)}
                    >
                      {showDropBefore && (
                        <div className="h-0.5 bg-[var(--color-pastel-accent)] dark:bg-[var(--color-dark-accent)] rounded-full mb-2" />
                      )}
                      <div
                        className={`rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all ${
                          dragItem?.type === 'card' && dragItem.id === card.id
                            ? 'opacity-50'
                            : ''
                        } bg-white dark:bg-[var(--color-dark-bg)] border-l-[3px] border border-[var(--color-pastel-border)]/20 dark:border-[var(--color-dark-border-subtle)] hover:shadow-pastel dark:hover:border-[var(--color-dark-accent)]/20 ${
                          card.priority === 'high'
                            ? 'border-l-red-400 dark:border-l-red-400'
                            : card.priority === 'low'
                            ? 'border-l-emerald-400 dark:border-l-emerald-400'
                            : 'border-l-[var(--color-pastel-accent)] dark:border-l-[var(--color-dark-accent)]'
                        }`}
                        draggable
                        onDragStart={(e) => handleCardDragStart(e, card.id, column.id)}
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-[var(--color-pastel-text-primary)] dark:text-[var(--color-dark-text-primary)]">{card.title}</p>
                          <button
                            onClick={() => handleDeleteCard(column.id, card.id)}
                            className="text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)] hover:text-red-500 dark:hover:text-red-400 text-sm ml-2 transition-colors"
                            draggable={false}
                          >
                            &times;
                          </button>
                        </div>
                        {card.description && (
                          <p className="text-xs text-[var(--color-pastel-text-secondary)] dark:text-[var(--color-dark-text-secondary)] mt-1 line-clamp-2">{card.description}</p>
                        )}
                        {card.due_date && (
                          <div className="flex items-center gap-1 mt-2">
                            <svg className="w-3 h-3 text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)]">
                              {new Date(card.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {dropTarget?.columnId === column.id &&
                 dropTarget?.cardIndex === column.cards.length &&
                 dragItem?.type === 'card' && (
                  <div className="h-0.5 bg-[var(--color-pastel-accent)] dark:bg-[var(--color-dark-accent)] rounded-full mt-2" />
                )}
              </div>

              {/* Add card form */}
              <AddCardForm onAdd={(title) => handleAddCard(column.id, title)} />
            </div>
          ))}

          {/* Add column form */}
          <div className="rounded-2xl p-4 w-72 flex-shrink-0 border border-dashed border-[var(--color-pastel-border)]/40 dark:border-[var(--color-dark-border-subtle)] bg-[var(--color-pastel-column)]/50 dark:bg-[var(--color-dark-column)]/30">
            <form onSubmit={handleAddColumn}>
              <input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="+ Add column"
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-pastel-border)]/20 dark:border-[var(--color-dark-border-subtle)] bg-white/50 dark:bg-[var(--color-dark-bg)]/50 text-[var(--color-pastel-text-primary)] dark:text-[var(--color-dark-text-primary)] placeholder-[var(--color-pastel-text-muted)] dark:placeholder-[var(--color-dark-text-muted)] focus:bg-white dark:focus:bg-[var(--color-dark-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pastel-accent)]/50 dark:focus:ring-[var(--color-dark-accent)]/50 text-sm"
              />
              {newColumnTitle && (
                <div className="flex gap-2 mt-3">
                  <button
                    type="submit"
                    disabled={addingColumn}
                    className="px-4 py-1.5 bg-[var(--color-pastel-accent)] hover:bg-[var(--color-pastel-accent-hover)] dark:bg-[var(--color-dark-accent)] dark:hover:bg-[var(--color-dark-accent-hover)] text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewColumnTitle('')}
                    className="px-4 py-1.5 text-[var(--color-pastel-text-secondary)] dark:text-[var(--color-dark-text-secondary)] hover:bg-[var(--color-pastel-sidebar-hover)] dark:hover:bg-[var(--color-dark-sidebar-hover)] rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

// Component for adding cards
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
        className="w-full text-left text-[var(--color-pastel-text-muted)] dark:text-[var(--color-dark-text-muted)] hover:text-[var(--color-pastel-text-secondary)] dark:hover:text-[var(--color-dark-text-secondary)] mt-3 px-3 py-1.5 rounded-xl hover:bg-[var(--color-pastel-sidebar-hover)] dark:hover:bg-[var(--color-dark-sidebar-hover)] text-sm transition-colors"
        draggable={false}
      >
        + Add card
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3" draggable={false}>
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter card title..."
        className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-pastel-border)]/20 dark:border-[var(--color-dark-border-subtle)] bg-white dark:bg-[var(--color-dark-bg)] text-[var(--color-pastel-text-primary)] dark:text-[var(--color-dark-text-primary)] placeholder-[var(--color-pastel-text-muted)] dark:placeholder-[var(--color-dark-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-pastel-accent)]/50 dark:focus:ring-[var(--color-dark-accent)]/50 resize-none text-sm"
        rows={2}
        autoFocus
      />
      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          className="px-4 py-1.5 bg-[var(--color-pastel-accent)] hover:bg-[var(--color-pastel-accent-hover)] dark:bg-[var(--color-dark-accent)] dark:hover:bg-[var(--color-dark-accent-hover)] text-white rounded-xl text-sm font-medium transition-colors"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => { setIsAdding(false); setTitle('') }}
          className="px-4 py-1.5 text-[var(--color-pastel-text-secondary)] dark:text-[var(--color-dark-text-secondary)] hover:bg-[var(--color-pastel-sidebar-hover)] dark:hover:bg-[var(--color-dark-sidebar-hover)] rounded-xl text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
