'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { checkAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export type TaskLink = { url: string; label: string }

export type KanbanTask = {
  id: string
  title: string
  description: string | null
  status: string
  priority: number
  position: number
  assignee: string | null
  links: TaskLink[]
  images: string[]
  created_at: string
  updated_at: string
}

export async function getPlanungTasks() {
  const isAuthed = await checkAuth()
  if (!isAuthed) return { error: 'Nicht authentifiziert' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('kanban_tasks')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data: data as KanbanTask[] }
}

export async function createPlanungTask(input: {
  title: string
  description: string | null
  priority: number
  assignee: string | null
  links: TaskLink[]
}) {
  const isAuthed = await checkAuth()
  if (!isAuthed) return { error: 'Nicht authentifiziert' }

  const supabase = createAdminClient()

  // Get max position in backlog column
  const { data: maxRow } = await supabase
    .from('kanban_tasks')
    .select('position')
    .eq('status', 'backlog')
    .order('position', { ascending: false })
    .limit(1)
    .single()
  const nextPos = (maxRow?.position ?? -1) + 1

  const { data, error } = await supabase
    .from('kanban_tasks')
    .insert({
      title: input.title,
      description: input.description || null,
      priority: input.priority,
      assignee: input.assignee || null,
      links: input.links,
      images: [],
      status: 'backlog',
      position: nextPos,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/intern/planung')
  return { success: true, data: data as KanbanTask }
}

export async function updatePlanungTask(
  id: string,
  updates: {
    title?: string
    description?: string | null
    status?: string
    priority?: number
    position?: number
    assignee?: string | null
    links?: TaskLink[]
    images?: string[]
  }
) {
  const isAuthed = await checkAuth()
  if (!isAuthed) return { error: 'Nicht authentifiziert' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('kanban_tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/intern/planung')
  return { success: true }
}

export async function deletePlanungTask(id: string) {
  const isAuthed = await checkAuth()
  if (!isAuthed) return { error: 'Nicht authentifiziert' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('kanban_tasks')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/intern/planung')
  return { success: true }
}

export async function uploadTaskImage(formData: FormData) {
  const isAuthed = await checkAuth()
  if (!isAuthed) return { error: 'Nicht authentifiziert' }

  const file = formData.get('file') as File
  if (!file) return { error: 'Keine Datei' }

  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const supabase = createAdminClient()
  const { error } = await supabase.storage
    .from('kanban-images')
    .upload(filename, file)

  if (error) return { error: error.message }

  const { data: urlData } = supabase.storage
    .from('kanban-images')
    .getPublicUrl(filename)

  return { url: urlData.publicUrl }
}

export async function deleteTaskImage(url: string) {
  const isAuthed = await checkAuth()
  if (!isAuthed) return { error: 'Nicht authentifiziert' }

  const parts = url.split('/kanban-images/')
  if (parts.length < 2) return { error: 'Ungültige URL' }

  const supabase = createAdminClient()
  const { error } = await supabase.storage
    .from('kanban-images')
    .remove([parts[1]])

  if (error) return { error: error.message }
  return { success: true }
}

export async function reorderTasks(taskIds: string[]) {
  const isAuthed = await checkAuth()
  if (!isAuthed) return { error: 'Nicht authentifiziert' }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  for (let i = 0; i < taskIds.length; i++) {
    const { error } = await supabase
      .from('kanban_tasks')
      .update({ position: i, updated_at: now })
      .eq('id', taskIds[i])
    if (error) return { error: error.message }
  }

  revalidatePath('/intern/planung')
  return { success: true }
}
