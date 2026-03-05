'use client'

import { useEffect, useState, useRef, useCallback, type DragEvent } from 'react'
import {
  getPlanungTasks,
  createPlanungTask,
  updatePlanungTask,
  deletePlanungTask,
  uploadTaskImage,
  deleteTaskImage,
  reorderTasks,
  type KanbanTask,
  type TaskLink,
} from './actions'

const COLUMNS = [
  { key: 'backlog', label: 'Geplant' },
  { key: 'in_progress', label: 'In Bearbeitung' },
  { key: 'waiting', label: 'Wartet auf Rückmeldung' },
  { key: 'done', label: 'Fertiggestellt' },
] as const

const PRIORITIES = [
  { value: 1, label: 'Hoch', className: 'prio--high' },
  { value: 2, label: 'Mittel', className: 'prio--medium' },
  { value: 3, label: 'Niedrig', className: 'prio--low' },
] as const

export function PlanungDashboard() {
  const [tasks, setTasks] = useState<KanbanTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewImg, setPreviewImg] = useState<string | null>(null)

  // Drag state
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)
  const [dragSourceCol, setDragSourceCol] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
  const [dragOverPosition, setDragOverPosition] = useState<'top' | 'bottom' | null>(null)

  // Create form state
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState(2)
  const [newAssignee, setNewAssignee] = useState('')
  const [newLinks, setNewLinks] = useState<TaskLink[]>([])

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPriority, setEditPriority] = useState(2)
  const [editStatus, setEditStatus] = useState('')
  const [editAssignee, setEditAssignee] = useState('')
  const [editLinks, setEditLinks] = useState<TaskLink[]>([])
  const [editImages, setEditImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadTasks = async () => {
    const result = await getPlanungTasks()
    if (result.data) setTasks(result.data)
    setLoading(false)
  }

  useEffect(() => { loadTasks() }, [])

  const tasksByCol = useCallback(
    (col: string) => tasks.filter(t => t.status === col),
    [tasks],
  )

  // ── Create ──
  const resetCreate = () => {
    setNewTitle('')
    setNewDesc('')
    setNewPriority(2)
    setNewAssignee('')
    setNewLinks([])
    setShowCreate(false)
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setSaving(true)
    await createPlanungTask({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      priority: newPriority,
      assignee: newAssignee.trim() || null,
      links: newLinks.filter(l => l.url.trim()),
    })
    resetCreate()
    await loadTasks()
    setSaving(false)
  }

  // ── Edit ──
  const startEdit = (task: KanbanTask) => {
    setEditingTask(task)
    setEditTitle(task.title)
    setEditDesc(task.description || '')
    setEditPriority(task.priority)
    setEditStatus(task.status)
    setEditAssignee(task.assignee || '')
    setEditLinks(task.links?.length ? [...task.links] : [])
    setEditImages(task.images || [])
  }

  const handleUpdate = async () => {
    if (!editingTask || !editTitle.trim()) return
    setSaving(true)
    await updatePlanungTask(editingTask.id, {
      title: editTitle.trim(),
      description: editDesc.trim() || null,
      priority: editPriority,
      status: editStatus,
      assignee: editAssignee.trim() || null,
      links: editLinks.filter(l => l.url.trim()),
      images: editImages,
    })
    setEditingTask(null)
    await loadTasks()
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!editingTask) return
    setSaving(true)
    for (const img of editImages) {
      await deleteTaskImage(img)
    }
    await deletePlanungTask(editingTask.id)
    setEditingTask(null)
    await loadTasks()
    setSaving(false)
  }

  // ── Image Upload ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      const result = await uploadTaskImage(fd)
      if (result.url) {
        setEditImages(prev => [...prev, result.url!])
      }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = async (url: string) => {
    await deleteTaskImage(url)
    setEditImages(prev => prev.filter(u => u !== url))
  }

  // ── Reorder (up/down) ──
  const swapTasks = async (colKey: string, fromIdx: number, toIdx: number) => {
    const colTasks = tasksByCol(colKey)
    if (toIdx < 0 || toIdx >= colTasks.length) return
    const ids = colTasks.map(t => t.id)
    const [moved] = ids.splice(fromIdx, 1)
    ids.splice(toIdx, 0, moved)
    // Optimistic reorder
    const reordered = ids.map((id, i) => {
      const t = tasks.find(t => t.id === id)!
      return { ...t, position: i }
    })
    setTasks(prev => {
      const others = prev.filter(t => t.status !== colKey)
      return [...others, ...reordered].sort((a, b) => a.position - b.position)
    })
    await reorderTasks(ids)
  }

  // ── Drag & Drop ──
  const onDragStart = (e: DragEvent, task: KanbanTask) => {
    setDragTaskId(task.id)
    setDragSourceCol(task.status)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task.id)
  }

  const onDragOverCol = (e: DragEvent, colKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(colKey)
  }

  const onDragOverCard = (e: DragEvent, taskId: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    setDragOverTaskId(taskId)
    setDragOverPosition(e.clientY < midY ? 'top' : 'bottom')
  }

  const onDragLeaveCard = () => {
    setDragOverTaskId(null)
    setDragOverPosition(null)
  }

  const onDragLeaveCol = () => {
    setDragOverCol(null)
  }

  const onDrop = async (e: DragEvent, colKey: string) => {
    e.preventDefault()
    setDragOverCol(null)
    setDragOverTaskId(null)
    setDragOverPosition(null)

    const taskId = e.dataTransfer.getData('text/plain')
    if (!taskId) return
    const task = tasks.find(t => t.id === taskId)
    if (!task) { setDragTaskId(null); return }

    const targetColTasks = tasksByCol(colKey).filter(t => t.id !== taskId)
    const newIds = targetColTasks.map(t => t.id)

    // If dropping on same column, just reorder; otherwise move to new column
    if (task.status !== colKey) {
      // Move to new column — append at end
      newIds.push(taskId)
      // Optimistic
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: colKey } : t))
      setDragTaskId(null)
      await updatePlanungTask(taskId, { status: colKey })
      await reorderTasks(newIds)
      await loadTasks()
    } else {
      // Same column, append at end (card-level drop handles specific position)
      newIds.push(taskId)
      setDragTaskId(null)
      await reorderTasks(newIds)
      await loadTasks()
    }
  }

  const onDropCard = async (e: DragEvent, targetTaskId: string, colKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverCol(null)
    setDragOverTaskId(null)
    setDragOverPosition(null)

    const taskId = e.dataTransfer.getData('text/plain')
    if (!taskId || taskId === targetTaskId) { setDragTaskId(null); return }

    const task = tasks.find(t => t.id === taskId)
    if (!task) { setDragTaskId(null); return }

    // If coming from different column, update status first
    if (task.status !== colKey) {
      await updatePlanungTask(taskId, { status: colKey })
    }

    // Build new order for this column
    const colTasks = tasksByCol(colKey).filter(t => t.id !== taskId)
    const targetIdx = colTasks.findIndex(t => t.id === targetTaskId)
    const insertIdx = dragOverPosition === 'top' ? targetIdx : targetIdx + 1
    const newIds = colTasks.map(t => t.id)
    newIds.splice(insertIdx, 0, taskId)

    // Optimistic
    setTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? { ...t, status: colKey } : t)
      return updated
    })
    setDragTaskId(null)
    await reorderTasks(newIds)
    await loadTasks()
  }

  const onDragEnd = () => {
    setDragTaskId(null)
    setDragSourceCol(null)
    setDragOverCol(null)
    setDragOverTaskId(null)
    setDragOverPosition(null)
  }

  const moveTask = async (task: KanbanTask, newStatus: string) => {
    // Move to end of target column
    const targetTasks = tasksByCol(newStatus)
    const newIds = [...targetTasks.map(t => t.id), task.id]
    await updatePlanungTask(task.id, { status: newStatus })
    await reorderTasks(newIds)
    await loadTasks()
  }

  // ── Link helpers ──
  const addLink = (setter: React.Dispatch<React.SetStateAction<TaskLink[]>>) => {
    setter(prev => [...prev, { url: '', label: '' }])
  }

  const updateLink = (
    setter: React.Dispatch<React.SetStateAction<TaskLink[]>>,
    idx: number,
    field: 'url' | 'label',
    value: string,
  ) => {
    setter(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  const removeLink = (setter: React.Dispatch<React.SetStateAction<TaskLink[]>>, idx: number) => {
    setter(prev => prev.filter((_, i) => i !== idx))
  }

  if (loading) {
    return (
      <div className="intern" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#5a6a7a' }}>Daten werden geladen...</p>
      </div>
    )
  }

  const prioLabel = (p: number) => PRIORITIES.find(pr => pr.value === p)

  // ── Link Fields Component ──
  const LinkFields = ({
    links,
    setter,
  }: {
    links: TaskLink[]
    setter: React.Dispatch<React.SetStateAction<TaskLink[]>>
  }) => (
    <div className="kb-field">
      <label className="kb-label">Links</label>
      {links.map((link, i) => (
        <div key={i} className="kb-link-row">
          <input
            className="kb-input kb-input--sm"
            placeholder="URL"
            value={link.url}
            onChange={e => updateLink(setter, i, 'url', e.target.value)}
          />
          <input
            className="kb-input kb-input--sm"
            placeholder="Bezeichnung (optional)"
            value={link.label}
            onChange={e => updateLink(setter, i, 'label', e.target.value)}
          />
          <button type="button" className="kb-remove-btn" onClick={() => removeLink(setter, i)}>×</button>
        </div>
      ))}
      <button type="button" className="kb-add-link" onClick={() => addLink(setter)}>+ Link hinzufügen</button>
    </div>
  )

  return (
    <div className="intern intern--wide">
      <div className="kb-toolbar">
        <button className="rabatt-btn rabatt-btn--save" onClick={() => setShowCreate(true)}>
          + Neue Aufgabe
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="kb-overlay" onClick={resetCreate}>
          <div className="kb-modal kb-modal--wide" onClick={e => e.stopPropagation()}>
            <h3>Neue Aufgabe</h3>
            <input
              className="kb-input"
              placeholder="Titel"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              autoFocus
            />
            <textarea
              className="kb-input kb-textarea kb-textarea--lg"
              placeholder="Beschreibung (optional)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              rows={6}
            />
            <div className="kb-field-row">
              <div className="kb-field">
                <label className="kb-label">Priorität</label>
                <select className="kb-select" value={newPriority} onChange={e => setNewPriority(Number(e.target.value))}>
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="kb-field">
                <label className="kb-label">Verantwortlicher</label>
                <input
                  className="kb-input"
                  style={{ marginBottom: 0 }}
                  placeholder="Name"
                  value={newAssignee}
                  onChange={e => setNewAssignee(e.target.value)}
                />
              </div>
            </div>
            <LinkFields links={newLinks} setter={setNewLinks} />
            <div className="kb-modal-actions">
              <button className="rabatt-btn rabatt-btn--save" onClick={handleCreate} disabled={saving || !newTitle.trim()}>
                {saving ? '...' : 'Erstellen'}
              </button>
              <button className="rabatt-btn rabatt-btn--cancel" onClick={resetCreate}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <div className="kb-overlay" onClick={() => setEditingTask(null)}>
          <div className="kb-modal kb-modal--wide" onClick={e => e.stopPropagation()}>
            <h3>Aufgabe bearbeiten</h3>
            <input
              className="kb-input"
              placeholder="Titel"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              autoFocus
            />
            <textarea
              className="kb-input kb-textarea kb-textarea--lg"
              placeholder="Beschreibung"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={6}
            />
            <div className="kb-field-row kb-field-row--3">
              <div className="kb-field">
                <label className="kb-label">Priorität</label>
                <select className="kb-select" value={editPriority} onChange={e => setEditPriority(Number(e.target.value))}>
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="kb-field">
                <label className="kb-label">Status</label>
                <select className="kb-select" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                  {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div className="kb-field">
                <label className="kb-label">Verantwortlicher</label>
                <input
                  className="kb-input"
                  style={{ marginBottom: 0 }}
                  placeholder="Name"
                  value={editAssignee}
                  onChange={e => setEditAssignee(e.target.value)}
                />
              </div>
            </div>
            <LinkFields links={editLinks} setter={setEditLinks} />

            {/* Images */}
            <div className="kb-field">
              <label className="kb-label">Bilder / Screenshots</label>
              {editImages.length > 0 && (
                <div className="kb-images-grid">
                  {editImages.map(url => (
                    <div key={url} className="kb-img-thumb">
                      <img src={url} alt="" onClick={() => setPreviewImg(url)} />
                      <button className="kb-img-remove" onClick={() => removeImage(url)}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="kb-add-link"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Wird hochgeladen...' : '+ Bild hinzufügen'}
              </button>
            </div>

            <div className="kb-modal-actions">
              <button className="rabatt-btn rabatt-btn--save" onClick={handleUpdate} disabled={saving || !editTitle.trim()}>
                {saving ? '...' : 'Speichern'}
              </button>
              <button className="rabatt-btn rabatt-btn--cancel" onClick={() => setEditingTask(null)}>Abbrechen</button>
              <button className="kb-delete-btn" onClick={handleDelete} disabled={saving}>Löschen</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewImg && (
        <div className="kb-overlay" onClick={() => setPreviewImg(null)} style={{ zIndex: 200 }}>
          <div className="kb-lightbox" onClick={e => e.stopPropagation()}>
            <img src={previewImg} alt="" />
            <button className="kb-lightbox__close" onClick={() => setPreviewImg(null)}>×</button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="kb-board">
        {COLUMNS.map(col => {
          const colTasks = tasksByCol(col.key)
          return (
            <div
              key={col.key}
              className={`kb-column${dragOverCol === col.key && dragOverTaskId === null ? ' kb-column--dragover' : ''}`}
              onDragOver={e => onDragOverCol(e, col.key)}
              onDragLeave={onDragLeaveCol}
              onDrop={e => onDrop(e, col.key)}
            >
              <div className="kb-column__header">
                <span className="kb-column__title">{col.label}</span>
                <span className="kb-column__count">{colTasks.length}</span>
              </div>
              <div className="kb-column__body">
                {colTasks.map((task, idx) => {
                  const prio = prioLabel(task.priority)
                  const isDragging = dragTaskId === task.id
                  const isOver = dragOverTaskId === task.id
                  return (
                    <div
                      key={task.id}
                      className={[
                        'kb-card',
                        isDragging ? 'kb-card--dragging' : '',
                        isOver && dragOverPosition === 'top' ? 'kb-card--drop-above' : '',
                        isOver && dragOverPosition === 'bottom' ? 'kb-card--drop-below' : '',
                      ].filter(Boolean).join(' ')}
                      draggable
                      onDragStart={e => onDragStart(e, task)}
                      onDragOver={e => onDragOverCard(e, task.id)}
                      onDragLeave={onDragLeaveCard}
                      onDrop={e => onDropCard(e, task.id, col.key)}
                      onDragEnd={onDragEnd}
                      onClick={() => startEdit(task)}
                    >
                      <div className="kb-card__header">
                        <span className={`kb-prio ${prio?.className || ''}`}>{prio?.label || ''}</span>
                        {task.assignee && (
                          <span className="kb-card__assignee">{task.assignee}</span>
                        )}
                      </div>
                      <h4 className="kb-card__title">{task.title}</h4>
                      {task.description && (
                        <p className="kb-card__desc">
                          {task.description.length > 100
                            ? task.description.slice(0, 100) + '...'
                            : task.description}
                        </p>
                      )}
                      {(task.links?.length > 0 || task.images?.length > 0) && (
                        <div className="kb-card__meta">
                          {task.links?.length > 0 && (
                            <span className="kb-card__meta-tag">🔗 {task.links.length}</span>
                          )}
                          {task.images?.length > 0 && (
                            <span className="kb-card__meta-tag">📷 {task.images.length}</span>
                          )}
                        </div>
                      )}
                      <div className="kb-card__actions">
                        {idx > 0 && (
                          <button
                            className="kb-move-btn"
                            onClick={e => { e.stopPropagation(); swapTasks(col.key, idx, idx - 1) }}
                            title="Nach oben"
                          >▲</button>
                        )}
                        {idx < colTasks.length - 1 && (
                          <button
                            className="kb-move-btn"
                            onClick={e => { e.stopPropagation(); swapTasks(col.key, idx, idx + 1) }}
                            title="Nach unten"
                          >▼</button>
                        )}
                        <span className="kb-actions-spacer" />
                        {col.key !== 'backlog' && (
                          <button
                            className="kb-move-btn"
                            onClick={e => { e.stopPropagation(); moveTask(task, COLUMNS[COLUMNS.findIndex(c => c.key === col.key) - 1].key) }}
                            title="Nach links"
                          >←</button>
                        )}
                        {col.key !== 'done' && (
                          <button
                            className="kb-move-btn"
                            onClick={e => { e.stopPropagation(); moveTask(task, COLUMNS[COLUMNS.findIndex(c => c.key === col.key) + 1].key) }}
                            title="Nach rechts"
                          >→</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
