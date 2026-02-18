'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TradeSetup, SetupFormData, TradingProfile } from './types'

export async function getSetups(profiles?: TradingProfile[]): Promise<TradeSetup[]> {
  const supabase = await createClient()
  let query = supabase
    .from('trade_setups')
    .select('*')
    .order('datum', { ascending: false })

  // Filter by profiles if specified
  if (profiles && profiles.length > 0) {
    query = query.in('profil', profiles)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return (data as TradeSetup[]) ?? []
}

export async function createSetup(formData: SetupFormData): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trade_setups').insert([formData])
  if (error) throw new Error(error.message)
  revalidatePath('/setups')
}

export async function updateSetup(id: string, formData: SetupFormData): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trade_setups').update(formData).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/setups')
}

export async function deleteSetup(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('trade_setups').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/setups')
}
