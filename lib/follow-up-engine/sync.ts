import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Invoice, InvoiceStatus, Priority, Proposal, ProposalStatus } from '@/types/database'
import { computeInvoicePriority, computeProposalPriority } from './engine'

/**
 * Recompute one invoice's status/priority against "now" and persist if
 * changed. Shared by the daily cron (all orgs, service-role client) and the
 * per-request live sync below (one org, user-scoped client) so both stay in
 * lockstep — same rules, same manual-override respect, one place to fix.
 */
export async function syncInvoiceStatusAndPriority(
  supabase: SupabaseClient<Database>,
  invoice: Pick<Invoice, 'id' | 'due_date' | 'status' | 'priority' | 'priority_manual'>
): Promise<{ status: InvoiceStatus; priority: Priority; changed: boolean }> {
  const priority = invoice.priority_manual ? invoice.priority : computeInvoicePriority(invoice.due_date, invoice.status)
  const isNowOverdue = invoice.status === 'sent' && new Date(invoice.due_date) < new Date()
  const status: InvoiceStatus = isNowOverdue ? 'overdue' : invoice.status

  const changed = status !== invoice.status || priority !== invoice.priority
  if (changed) {
    await supabase.from('invoices').update({ status, priority }).eq('id', invoice.id)
  }

  return { status, priority, changed }
}

/**
 * Same idea for proposals: escalate priority as they age, and flip 'sent' to
 * 'follow_up_due' once they're old enough to need chasing.
 */
export async function syncProposalStatusAndPriority(
  supabase: SupabaseClient<Database>,
  proposal: Pick<Proposal, 'id' | 'sent_date' | 'status' | 'priority'>
): Promise<{ status: ProposalStatus; priority: Priority; changed: boolean }> {
  const priority = computeProposalPriority(proposal.sent_date, proposal.status)
  const status: ProposalStatus =
    priority !== 'low' && proposal.status === 'sent' ? 'follow_up_due' : proposal.status

  const changed = priority !== proposal.priority || status !== proposal.status
  if (changed) {
    await supabase.from('proposals').update({ status, priority }).eq('id', proposal.id)
  }

  return { status, priority, changed }
}

/**
 * Refresh every open invoice's and proposal's status/priority for one org.
 * Runs on every authenticated page load (via getOrganization) so overdue
 * detection and stale-proposal escalation don't wait for tomorrow's cron —
 * the cron still owns generating follow-up reminders and recurring invoices,
 * this only keeps what's shown truthful.
 */
export async function syncOrgWorkState(supabase: SupabaseClient<Database>, organizationId: string): Promise<number> {
  const [{ data: invoices }, { data: proposals }] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, due_date, status, priority, priority_manual')
      .eq('organization_id', organizationId)
      .in('status', ['sent', 'overdue', 'partially_paid']),
    supabase
      .from('proposals')
      .select('id, sent_date, status, priority')
      .eq('organization_id', organizationId)
      .in('status', ['sent', 'viewed', 'follow_up_due']),
  ])

  let updated = 0
  for (const invoice of invoices ?? []) {
    if ((await syncInvoiceStatusAndPriority(supabase, invoice)).changed) updated++
  }
  for (const proposal of proposals ?? []) {
    if ((await syncProposalStatusAndPriority(supabase, proposal)).changed) updated++
  }
  return updated
}
