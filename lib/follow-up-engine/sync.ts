import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Invoice, InvoiceStatus, Priority, Proposal, ProposalStatus } from '@/types/database'
import { computeInvoicePriority, computeProposalPriority, isPastDue } from './engine'

/**
 * Recompute one invoice's status/priority against "now" and persist if
 * changed. Shared by the daily cron (all orgs, service-role client), the
 * per-page live sync below, and the manual "run engine" action so every
 * writer applies the same rules — including respecting priority_manual.
 * `changed` is only true when the write actually landed.
 */
export async function syncInvoiceStatusAndPriority(
  supabase: SupabaseClient<Database>,
  invoice: Pick<Invoice, 'id' | 'due_date' | 'status' | 'priority' | 'priority_manual'>
): Promise<{ status: InvoiceStatus; priority: Priority; changed: boolean }> {
  const priority = invoice.priority_manual ? invoice.priority : computeInvoicePriority(invoice.due_date, invoice.status)
  // Date-only: an invoice due today is not overdue yet — overdue starts the
  // day after, matching computeInvoicePriority's day math. The reverse rule
  // heals rows the pre-fix code marked overdue prematurely (or whose due
  // date was pushed out after they went overdue).
  let status: InvoiceStatus = invoice.status
  if (invoice.status === 'sent' && isPastDue(invoice.due_date)) status = 'overdue'
  if (invoice.status === 'overdue' && !isPastDue(invoice.due_date)) status = 'sent'

  if (status === invoice.status && priority === invoice.priority) {
    return { status, priority, changed: false }
  }

  const { error } = await supabase.from('invoices').update({ status, priority }).eq('id', invoice.id)
  return { status, priority, changed: !error }
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

  if (status === proposal.status && priority === proposal.priority) {
    return { status, priority, changed: false }
  }

  const { error } = await supabase.from('proposals').update({ status, priority }).eq('id', proposal.id)
  return { status, priority, changed: !error }
}

/**
 * Refresh every open invoice's and proposal's status/priority for one org.
 * Called by the pages that display work state (dashboard, invoices,
 * proposals, follow-ups) before they fetch, so overdue detection and
 * stale-proposal escalation don't wait for tomorrow's cron. The cron still
 * owns follow-up reminders and recurring invoices.
 *
 * Never throws: stale badges are better than a broken page.
 */
export async function syncOrgWorkState(supabase: SupabaseClient<Database>, organizationId: string): Promise<number> {
  try {
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

    const results = await Promise.all([
      ...(invoices ?? []).map((invoice) => syncInvoiceStatusAndPriority(supabase, invoice)),
      ...(proposals ?? []).map((proposal) => syncProposalStatusAndPriority(supabase, proposal)),
    ])
    return results.filter((r) => r.changed).length
  } catch {
    return 0
  }
}
