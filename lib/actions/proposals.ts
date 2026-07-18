'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getOrgContext, requireOrgOrRedirect } from '@/lib/supabase/guards'
import { logActivity } from './activities'
import { applyPriorityChange } from './entity-priority'
import { computeProposalPriority } from '@/lib/follow-up-engine/engine'
import type { ActionState, Priority, ProposalStatus } from '@/types/database'

function proposalActivityType(status: ProposalStatus) {
  return status === 'won' ? 'proposal_won' : status === 'lost' ? 'proposal_lost' : 'proposal_updated'
}

export async function createProposalAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, org } = await requireOrgOrRedirect('/login')

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
  const { supabase, org } = await requireOrgOrRedirect('/login')

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

  await logActivity({
    orgId: org.id,
    type: proposalActivityType(newStatus),
    entityType: 'proposal',
    entityId: id,
    description: `Updated proposal: ${data.title} → ${newStatus}`,
  })

  revalidatePath('/proposals')
  revalidatePath(`/proposals/${id}`)
  redirect(`/proposals/${id}`)
}

export async function deleteProposalAction(id: string) {
  const { supabase, org } = await requireOrgOrRedirect('/login')

  await supabase.from('proposals').delete().eq('id', id).eq('organization_id', org.id)

  revalidatePath('/proposals')
  redirect('/proposals')
}

/** Inline priority change from the proposals list. Requires the
 *  proposals.priority_manual column (migration-2026-07-07-proposal-priority.sql);
 *  an explicit level pins it against the age-based engine, "auto" unpins. */
export async function updateProposalPriorityAction(id: string, value: Priority | 'auto') {
  return applyPriorityChange('proposals', id, value, async (supabase, orgId) => {
    const { data: proposal } = await supabase
      .from('proposals')
      .select('sent_date, status')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single()
    if (!proposal) return { error: 'Proposal not found' }
    return { priority: computeProposalPriority(proposal.sent_date, proposal.status), priority_manual: false }
  })
}

export async function updateProposalStatusAction(id: string, status: ProposalStatus) {
  const { supabase, org } = await getOrgContext()
  if (!org) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('proposals')
    .update({ status })
    .eq('id', id)
    .eq('organization_id', org.id)

  if (error) return { error: error.message }

  await logActivity({
    orgId: org.id,
    type: proposalActivityType(status),
    entityType: 'proposal',
    entityId: id,
    description: `Proposal status changed to: ${status}`,
  })

  revalidatePath('/proposals')
  revalidatePath(`/proposals/${id}`)
}
