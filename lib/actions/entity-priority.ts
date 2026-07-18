// Not a 'use server' file — this is the shared core the invoice/proposal
// priority actions wrap, so it must not be callable from the client itself.
import { revalidatePath } from 'next/cache'
import { getOrgContext } from '@/lib/supabase/guards'
import type { createClient } from '@/lib/supabase/server'
import type { Priority } from '@/types/database'

type Supabase = Awaited<ReturnType<typeof createClient>>
type PriorityUpdate = { priority: Priority; priority_manual: boolean }

/** Inline priority select semantics, shared by invoices and proposals: an
 *  explicit level pins the priority (priority_manual), "auto" recomputes via
 *  the caller's resolveAuto and hands it back to the engine. */
export async function applyPriorityChange(
  table: 'invoices' | 'proposals',
  id: string,
  value: Priority | 'auto',
  resolveAuto: (supabase: Supabase, orgId: string) => Promise<PriorityUpdate | { error: string }>
) {
  const { supabase, org } = await getOrgContext()
  if (!org) return { error: 'Not authenticated' }

  const update = value === 'auto'
    ? await resolveAuto(supabase, org.id)
    : { priority: value, priority_manual: true }
  if ('error' in update) return update

  const { error } = await supabase
    .from(table)
    .update(update)
    .eq('id', id)
    .eq('organization_id', org.id)

  if (error) return { error: error.message }

  revalidatePath(`/${table}`)
  revalidatePath(`/${table}/${id}`)
  revalidatePath('/dashboard')
  return { success: true }
}
