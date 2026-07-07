'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { logActivity } from './activities'
import type { FollowUpEventStatus, FollowUpEventType, Priority } from '@/types/database'

export async function updateFollowUpStatusAction(id: string, status: FollowUpEventStatus) {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) return { error: 'Not authenticated' }

  const update: Record<string, unknown> = { status }
  if (status === 'sent' || status === 'completed') {
    update.sent_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('follow_up_events')
    .update(update)
    .eq('id', id)
    .eq('organization_id', org.id)

  if (error) return { error: error.message }

  const activityType = status === 'completed' ? 'followup_completed' : 'followup_skipped'
  await logActivity({
    orgId: org.id,
    type: activityType,
    entityType: 'follow_up',
    entityId: id,
    description: `Follow-up marked as ${status}`,
  })

  revalidatePath('/follow-ups')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateFollowUpPriorityAction(id: string, priority: Priority) {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('follow_up_events')
    .update({ priority })
    .eq('id', id)
    .eq('organization_id', org.id)

  if (error) return { error: error.message }

  revalidatePath('/follow-ups')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function runFollowUpEngineAction() {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) return { error: 'Not authenticated' }

  // Fetch all pending invoices and proposals to compute which need follow-up
  const [{ data: invoices }, { data: proposals }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*')
      .eq('organization_id', org.id)
      .in('status', ['sent', 'overdue', 'partially_paid']),
    supabase
      .from('proposals')
      .select('*')
      .eq('organization_id', org.id)
      .in('status', ['sent', 'viewed', 'follow_up_due']),
  ])

  const { computeInvoicePriority, invoiceNeedsFollowUp, proposalNeedsFollowUp, computeProposalPriority } = await import('@/lib/follow-up-engine/engine')

  const now = new Date().toISOString()
  const eventsToCreate: Array<{
    organization_id: string
    client_id: string
    invoice_id?: string
    proposal_id?: string
    type: FollowUpEventType
    status: FollowUpEventStatus
    priority: Priority
    due_date: string
  }> = []

  for (const invoice of invoices ?? []) {
    if (invoiceNeedsFollowUp(invoice.due_date, invoice.status, invoice.last_reminder_date)) {
      // Check if there's already a pending event for this invoice
      const { data: existing } = await supabase
        .from('follow_up_events')
        .select('id')
        .eq('invoice_id', invoice.id)
        .eq('status', 'pending')
        .single()

      if (!existing) {
        eventsToCreate.push({
          organization_id: org.id,
          client_id: invoice.client_id,
          invoice_id: invoice.id,
          type: 'invoice_reminder',
          status: 'pending',
          priority: computeInvoicePriority(invoice.due_date, invoice.status),
          due_date: now,
        })
      }
    }
  }

  for (const proposal of proposals ?? []) {
    if (proposalNeedsFollowUp(proposal.sent_date, proposal.status, proposal.last_follow_up_date, proposal.follow_up_cadence_days)) {
      const { data: existing } = await supabase
        .from('follow_up_events')
        .select('id')
        .eq('proposal_id', proposal.id)
        .eq('status', 'pending')
        .single()

      if (!existing) {
        eventsToCreate.push({
          organization_id: org.id,
          client_id: proposal.client_id,
          proposal_id: proposal.id,
          type: 'proposal_followup',
          status: 'pending',
          priority: computeProposalPriority(proposal.sent_date, proposal.status),
          due_date: now,
        })
      }
    }
  }

  if (eventsToCreate.length > 0) {
    await supabase.from('follow_up_events').insert(eventsToCreate)
  }

  revalidatePath('/follow-ups')
  return { created: eventsToCreate.length }
}
