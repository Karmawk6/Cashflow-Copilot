'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { logActivity } from './activities'
import { computeProposalPriority } from '@/lib/follow-up-engine/engine'
import type { ActionState, Priority, ProposalStatus } from '@/types/database'

export async function createProposalAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  const data = {
    organization_id: org.id,
    client_id: formData.get('client_id') as string,
    title: formData.get('title') as string,
    proposal_number: (formData.get('proposal_number') as string) || null,
    amount: parseFloat(formData.get('amount') as string) || 0,
    currency: (formData.get('currency') as string) || 'USD',
    sent_date: (formData.get('sent_date') as string) || null,
    expiration_date: (formData.get('expiration_date') as string) || null,
    status: ((formData.get('status') as ProposalStatus) || 'draft'),
    follow_up_cadence_days: parseInt(formData.get('follow_up_cadence_days') as string) || 3,
    notes: (formData.get('notes') as string) || null,
  }

  if (!data.client_id || !data.title) return { error: 'Client and title are required' }

  const { data: proposal, error } = await supabase.from('proposals').insert(data).select().single()
  if (error) return { error: error.message }

  await logActivity({
    orgId: org.id,
    type: 'proposal_created',
    entityType: 'proposal',
    entityId: proposal.id,
    description: `Created proposal: ${proposal.title}`,
    metadata: { amount: proposal.amount, currency: proposal.currency },
  })

  revalidatePath('/proposals')
  redirect('/proposals')
}

export async function updateProposalAction(id: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  const newStatus = formData.get('status') as ProposalStatus
  const data = {
    title: formData.get('title') as string,
    proposal_number: (formData.get('proposal_number') as string) || null,
    amount: parseFloat(formData.get('amount') as string) || 0,
    currency: (formData.get('currency') as string) || 'USD',
    sent_date: (formData.get('sent_date') as string) || null,
    expiration_date: (formData.get('expiration_date') as string) || null,
    status: newStatus,
    follow_up_cadence_days: parseInt(formData.get('follow_up_cadence_days') as string) || 3,
    notes: (formData.get('notes') as string) || null,
  }

  const { error } = await supabase
    .from('proposals')
    .update(data)
    .eq('id', id)
    .eq('organization_id', org.id)

  if (error) return { error: error.message }

  const activityType = newStatus === 'won' ? 'proposal_won' : newStatus === 'lost' ? 'proposal_lost' : 'proposal_updated'
  await logActivity({
    orgId: org.id,
    type: activityType,
    entityType: 'proposal',
    entityId: id,
    description: `Updated proposal: ${data.title} → ${newStatus}`,
  })

  revalidatePath('/proposals')
  revalidatePath(`/proposals/${id}`)
  redirect(`/proposals/${id}`)
}

export async function deleteProposalAction(id: string) {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  await supabase.from('proposals').delete().eq('id', id).eq('organization_id', org.id)

  revalidatePath('/proposals')
  redirect('/proposals')
}

/** Inline priority change from the proposals list. Requires the
 *  proposals.priority_manual column (migration-2026-07-07-proposal-priority.sql);
 *  an explicit level pins it against the age-based engine, "auto" unpins. */
export async function updateProposalPriorityAction(id: string, value: Priority | 'auto') {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) return { error: 'Not authenticated' }

  let update: { priority: Priority; priority_manual: boolean }
  if (value === 'auto') {
    const { data: proposal } = await supabase
      .from('proposals')
      .select('sent_date, status')
      .eq('id', id)
      .eq('organization_id', org.id)
      .single()
    if (!proposal) return { error: 'Proposal not found' }
    update = { priority: computeProposalPriority(proposal.sent_date, proposal.status), priority_manual: false }
  } else {
    update = { priority: value, priority_manual: true }
  }

  const { error } = await supabase
    .from('proposals')
    .update(update)
    .eq('id', id)
    .eq('organization_id', org.id)

  if (error) return { error: error.message }

  revalidatePath('/proposals')
  revalidatePath(`/proposals/${id}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateProposalStatusAction(id: string, status: ProposalStatus) {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('proposals')
    .update({ status })
    .eq('id', id)
    .eq('organization_id', org.id)

  if (error) return { error: error.message }

  const activityType = status === 'won' ? 'proposal_won' : status === 'lost' ? 'proposal_lost' : 'proposal_updated'
  await logActivity({
    orgId: org.id,
    type: activityType,
    entityType: 'proposal',
    entityId: id,
    description: `Proposal status changed to: ${status}`,
  })

  revalidatePath('/proposals')
  revalidatePath(`/proposals/${id}`)
}
