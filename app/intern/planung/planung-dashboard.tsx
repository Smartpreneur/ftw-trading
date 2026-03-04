'use client'

import { useEffect, useState } from 'react'
import {
  getPlanungTasks,
  createPlanungTask,
  updatePlanungTask,
  deletePlanungTask,
  type KanbanTask,
} from './actions'
import { logout } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useTheme } from '../use-theme'
import '../styles.css'

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
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState(2)
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPriority, setEditPriority] = useState(2)
  const [editStatus, setEditStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { light, toggle } = useTheme()

  const loadTasks = async () => {
    const result = await getPlanungTasks()
    if (result.data) setTasks(result.data)
    setLoading(false)
  }

  useEffect(() => { loadTasks() }, [])

  const handleLogout = async () => {
    await logout()
    router.refresh()
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setSaving(true)
    await createPlanungTask({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      priority: newPriority,
    })
    setNewTitle('')
    setNewDesc('')
    setNewPriority(2)
    setShowCreate(false)
    await loadTasks()
    setSaving(false)
  }

  const startEdit = (task: KanbanTask) => {
    setEditingTask(task)
    setEditTitle(task.title)
    setEditDesc(task.description || '')
    setEditPriority(task.priority)
    setEditStatus(task.status)
  }

  const handleUpdate = async () => {
    if (!editingTask || !editTitle.trim()) return
    setSaving(true)
    await updatePlanungTask(editingTask.id, {
      title: editTitle.trim(),
      description: editDesc.trim() || null,
      priority: editPriority,
      status: editStatus,
    })
    setEditingTask(null)
    await loadTasks()
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!editingTask) return
    setSaving(true)
    await deletePlanungTask(editingTask.id)
    setEditingTask(null)
    await loadTasks()
    setSaving(false)
  }

  const moveTask = async (task: KanbanTask, newStatus: string) => {
    await updatePlanungTask(task.id, { status: newStatus })
    await loadTasks()
  }

  if (loading) {
    return (
      <div className="intern" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#5a6a7a' }}>Daten werden geladen...</p>
      </div>
    )
  }

  const prioLabel = (p: number) => PRIORITIES.find(pr => pr.value === p)
  const tasksByCol = (col: string) => tasks.filter(t => t.status === col)

  return (
    <div className={`intern intern--wide${light ? ' light' : ''}`}>
      <header className="intern__header">
        <h1>Planung</h1>
        <div className="intern__header-actions">
          <a href="/intern" className="intern__nav-link">Übersicht</a>
          <button onClick={toggle} className="theme-toggle" title={light ? 'Dark Mode' : 'Light Mode'}>
            {light ? '🌙' : '☀️'}
          </button>
          <button onClick={handleLogout} className="intern__logout">
            Abmelden
          </button>
        </div>
      </header>

      <div className="kb-toolbar">
        <button className="rabatt-btn rabatt-btn--save" onClick={() => setShowCreate(true)}>
          + Neue Aufgabe
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="kb-overlay" onClick={() => setShowCreate(false)}>
          <div className="kb-modal" onClick={e => e.stopPropagation()}>
            <h3>Neue Aufgabe</h3>
            <input
              className="kb-input"
              placeholder="Titel"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              autoFocus
            />
            <textarea
              className="kb-input kb-textarea"
              placeholder="Beschreibung (optional)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              rows={3}
            />
            <div className="kb-field">
              <label className="kb-label">Priorität</label>
              <select className="kb-select" value={newPriority} onChange={e => setNewPriority(Number(e.target.value))}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="kb-modal-actions">
              <button className="rabatt-btn rabatt-btn--save" onClick={handleCreate} disabled={saving || !newTitle.trim()}>
                {saving ? '...' : 'Erstellen'}
              </button>
              <button className="rabatt-btn rabatt-btn--cancel" onClick={() => setShowCreate(false)}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <div className="kb-overlay" onClick={() => setEditingTask(null)}>
          <div className="kb-modal" onClick={e => e.stopPropagation()}>
            <h3>Aufgabe bearbeiten</h3>
            <input
              className="kb-input"
              placeholder="Titel"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              autoFocus
            />
            <textarea
              className="kb-input kb-textarea"
              placeholder="Beschreibung"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={3}
            />
            <div className="kb-field-row">
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

      {/* Kanban Board */}
      <div className="kb-board">
        {COLUMNS.map(col => {
          const colTasks = tasksByCol(col.key)
          return (
            <div key={col.key} className="kb-column">
              <div className="kb-column__header">
                <span className="kb-column__title">{col.label}</span>
                <span className="kb-column__count">{colTasks.length}</span>
              </div>
              <div className="kb-column__body">
                {colTasks.map(task => {
                  const prio = prioLabel(task.priority)
                  return (
                    <div key={task.id} className="kb-card" onClick={() => startEdit(task)}>
                      <div className="kb-card__header">
                        <span className={`kb-prio ${prio?.className || ''}`}>{prio?.label || ''}</span>
                      </div>
                      <h4 className="kb-card__title">{task.title}</h4>
                      {task.description && (
                        <p className="kb-card__desc">
                          {task.description.length > 100
                            ? task.description.slice(0, 100) + '...'
                            : task.description}
                        </p>
                      )}
                      <div className="kb-card__actions">
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
