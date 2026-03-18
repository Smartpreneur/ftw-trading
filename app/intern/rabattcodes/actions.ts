'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { checkAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export type CustomPrices = { quarterly: number; halfYear: number; yearly: number }
export type CustomPlanIds = { quarterly: number; halfYear: number; yearly: number }

export type DiscountCode = {
  id: string
  code: string
  label: string
  source: string
  coupon: string
  discount_pct: number
  valid_from: string | null
  valid_until: string | null
  campaign_id: string | null
  is_active: boolean
  custom_prices: CustomPrices | null
  custom_plan_ids: CustomPlanIds | null
  created_at: string
  updated_at: string
}

export async function getDiscountCodes() {
  const isAuthed = await checkAuth()
  if (!isAuthed) return { error: 'Nicht authentifiziert' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .order('code', { ascending: true })

  if (error) return { error: error.message }
  return { data: data as DiscountCode[] }
}

export async function updateDiscountCode(
  id: string,
  updates: {
    valid_from: string | null
    valid_until: string | null
    campaign_id: string | null
    is_active: boolean
  }
) {
  const isAuthed = await checkAuth()
  if (!isAuthed) return { error: 'Nicht authentifiziert' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('discount_codes')
    .update({
      valid_from: updates.valid_from || null,
      valid_until: updates.valid_until || null,
      campaign_id: updates.campaign_id || null,
      is_active: updates.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/intern/rabattcodes')
  return { success: true }
}
