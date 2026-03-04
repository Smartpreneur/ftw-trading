'use server'

import { createClient } from '@/lib/supabase/server'
import { checkAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export type KanbanTask = {
  id: string
  title: string
  description: string | null
  status: string
  priority: number
  position: number
  created_at: string
  updated_at: string
}

export async function getPlanungTasks() {
  const isAuthed = await checkAuth()
  if (!isAuthed) return { error: 'Nicht authentifiziert' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('kanban_tasks')
    .select('*')
    .order('priority', { ascending: true })
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data: data as KanbanTask[] }
}

export async function createPlanungTask(input: {
  title: string
  description: string | null
  priority: number
}) {
  const isAuthed = await checkAuth()
  if (!isAuthed) return { error: 'Nicht authentifiziert' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('kanban_tasks')
    .insert({
      title: input.title,
      description: input.description || null,
      priority: input.priority,
      status: 'backlog',
      position: 0,
    })

  if (error) return { error: error.message }
  revalidatePath('/intern/planung')
  return { success: true }
}

export async function updatePlanungTask(
  id: string,
  updates: {
    title?: string
    description?: string | null
    status?: string
    priority?: number
    position?: number
  }
) {
  const isAuthed = await checkAuth()
  if (!isAuthed) return { error: 'Nicht authentifiziert' }

  const supabase = await createClient()
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

  const supabase = await createClient()
  const { error } = await supabase
    .from('kanban_tasks')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/intern/planung')
  return { success: true }
}
