import type { InvoiceStatus, Priority, ProposalStatus, RecurringFrequency, RecurringSchedule } from '@/types/database'

// =============================================================================
// INVOICE PRIORITY LOGIC
// overdue 1–7 days = medium, 8–21 days = high, >21 days = critical
// =============================================================================
export function computeInvoicePriority(dueDate: string | null, status: InvoiceStatus): Priority {
  if (status === 'paid' || status === 'cancelled' || status === 'draft') return 'low'
  if (!dueDate) return 'low'

  const due = new Date(dueDate)
  const now = new Date()
  const daysOverdue = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))

  if (daysOverdue <= 0) return 'low'
  if (daysOverdue <= 7) return 'medium'
  if (daysOverdue <= 21) return 'high'
  return 'critical'
}

// =============================================================================
// PROPOSAL PRIORITY LOGIC
// no reply after 3 days = follow_up_due (medium), 7+ days = high, 14+ days = critical/stale
// =============================================================================
export function computeProposalPriority(
  sentDate: string | null,
  status: ProposalStatus
): Priority {
  if (status === 'won' || status === 'lost' || status === 'draft') return 'low'
  if (!sentDate) return 'low'

  const sent = new Date(sentDate)
  const now = new Date()
  const daysSinceSent = Math.floor((now.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSinceSent < 3) return 'low'
  if (daysSinceSent < 7) return 'medium'
  if (daysSinceSent < 14) return 'high'
  return 'critical'
}

// =============================================================================
// INVOICE: needs follow-up?
// =============================================================================
export function invoiceNeedsFollowUp(
  dueDate: string | null,
  status: InvoiceStatus,
  lastReminderDate: string | null
): boolean {
  if (status === 'paid' || status === 'cancelled' || status === 'draft') return false
  if (!dueDate) return false

  const due = new Date(dueDate)
  const now = new Date()

  // Not yet overdue
  if (due > now) return false

  // If we sent a reminder recently (within 3 days), don't spam
  if (lastReminderDate) {
    const lastReminder = new Date(lastReminderDate)
    const daysSinceReminder = Math.floor((now.getTime() - lastReminder.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceReminder < 3) return false
  }

  return true
}

// =============================================================================
// PROPOSAL: needs follow-up?
// =============================================================================
export function proposalNeedsFollowUp(
  sentDate: string | null,
  status: ProposalStatus,
  lastFollowUpDate: string | null,
  cadenceDays = 3
): boolean {
  if (status === 'won' || status === 'lost' || status === 'draft') return false
  if (!sentDate) return false

  const sent = new Date(sentDate)
  const now = new Date()
  const daysSinceSent = Math.floor((now.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSinceSent < cadenceDays) return false

  if (lastFollowUpDate) {
    const lastFollowUp = new Date(lastFollowUpDate)
    const daysSinceFollowUp = Math.floor((now.getTime() - lastFollowUp.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceFollowUp < cadenceDays) return false
  }

  return true
}

// =============================================================================
// GHOSTED LEAD: needs follow-up?
// =============================================================================
export function clientIsGhosted(
  lastContactDate: string | null,
  dayThreshold = 5
): boolean {
  if (!lastContactDate) return false
  const last = new Date(lastContactDate)
  const now = new Date()
  const daysSinceContact = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
  return daysSinceContact >= dayThreshold
}

// =============================================================================
// RECURRING SCHEDULES
// A due schedule becomes a normal invoice; these helpers are pure date math so
// both the daily cron and the create-schedule action share one behavior.
// =============================================================================

/** Parse a YYYY-MM-DD date string as UTC midnight (avoids TZ off-by-one). */
function parseDateOnly(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function formatDateOnly(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Next due date after `current`. Monthly-and-longer frequencies re-anchor to
 * `anchorDay` (clamped to the month's length) so Jan 31 → Feb 28 → Mar 31
 * instead of drifting to the 28th forever.
 */
export function advanceDueDate(current: string, frequency: RecurringFrequency, anchorDay: number): string {
  const d = parseDateOnly(current)

  if (frequency === 'weekly' || frequency === 'biweekly') {
    d.setUTCDate(d.getUTCDate() + (frequency === 'weekly' ? 7 : 14))
    return formatDateOnly(d)
  }

  const monthsToAdd = frequency === 'monthly' ? 1 : frequency === 'quarterly' ? 3 : 12
  const targetMonth = d.getUTCMonth() + monthsToAdd
  const year = d.getUTCFullYear() + Math.floor(targetMonth / 12)
  const month = targetMonth % 12
  const daysInTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return formatDateOnly(new Date(Date.UTC(year, month, Math.min(anchorDay, daysInTargetMonth))))
}

/**
 * Should the cron generate the next invoice for this schedule today?
 * Invoices are created `remind_days_before` days ahead of the due date so the
 * client can get a courtesy heads-up referencing a real invoice.
 */
export function scheduleShouldGenerate(
  schedule: Pick<
    RecurringSchedule,
    'status' | 'next_due_date' | 'end_date' | 'total_installments' | 'installments_generated' | 'remind_days_before'
  >,
  today = new Date()
): boolean {
  if (schedule.status !== 'active') return false
  if (schedule.total_installments !== null && schedule.installments_generated >= schedule.total_installments) {
    return false
  }
  const due = parseDateOnly(schedule.next_due_date)
  if (schedule.end_date && due > parseDateOnly(schedule.end_date)) return false

  const generateOn = new Date(due)
  generateOn.setUTCDate(generateOn.getUTCDate() - schedule.remind_days_before)
  return generateOn.getTime() <= today.getTime()
}

/** Schedule state after generating one invoice. */
export function scheduleAfterGeneration(
  schedule: Pick<
    RecurringSchedule,
    'next_due_date' | 'frequency' | 'anchor_day' | 'end_date' | 'total_installments' | 'installments_generated'
  >
): { next_due_date: string; installments_generated: number; status: 'active' | 'completed' } {
  const installments = schedule.installments_generated + 1
  const nextDue = advanceDueDate(schedule.next_due_date, schedule.frequency, schedule.anchor_day)

  const planDone = schedule.total_installments !== null && installments >= schedule.total_installments
  const pastEnd = schedule.end_date !== null && parseDateOnly(nextDue) > parseDateOnly(schedule.end_date)

  return {
    next_due_date: nextDue,
    installments_generated: installments,
    status: planDone || pastEnd ? 'completed' : 'active',
  }
}

// =============================================================================
// DASHBOARD SUMMARY
// =============================================================================
export interface DashboardSummary {
  totalUnpaidAmount: number
  totalOverdueAmount: number
  overdueCount: number
  staleProposalsCount: number
  staleProposalsAmount: number
  ghostedLeadsCount: number
  followUpsDueToday: number
  moneyAtRiskThisWeek: number
}

export function computeDashboardSummary(params: {
  invoices: Array<{ amount: number; amount_paid: number; due_date: string; status: InvoiceStatus }>
  proposals: Array<{ amount: number; sent_date: string | null; status: ProposalStatus; follow_up_cadence_days: number; last_follow_up_date: string | null }>
  clients: Array<{ status: string; last_contact_date: string | null }>
  followUps: Array<{ due_date: string | null; status: string }>
}): DashboardSummary {
  const now = new Date()
  const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const unpaidInvoices = params.invoices.filter(
    (i) => i.status !== 'paid' && i.status !== 'cancelled' && i.status !== 'draft'
  )

  const totalUnpaidAmount = unpaidInvoices.reduce((sum, i) => sum + (i.amount - i.amount_paid), 0)

  const overdueInvoices = unpaidInvoices.filter((i) => new Date(i.due_date) < now)
  const totalOverdueAmount = overdueInvoices.reduce((sum, i) => sum + (i.amount - i.amount_paid), 0)
  const overdueCount = overdueInvoices.length

  const staleProposals = params.proposals.filter(
    (p) => proposalNeedsFollowUp(p.sent_date, p.status, p.last_follow_up_date, p.follow_up_cadence_days)
  )
  const staleProposalsCount = staleProposals.length
  const staleProposalsAmount = staleProposals.reduce((sum, p) => sum + p.amount, 0)

  const ghostedLeads = params.clients.filter(
    (c) => c.status === 'ghosted' || clientIsGhosted(c.last_contact_date)
  )
  const ghostedLeadsCount = ghostedLeads.length

  const followUpsDueToday = params.followUps.filter((fu) => {
    if (fu.status !== 'pending') return false
    if (!fu.due_date) return false
    const due = new Date(fu.due_date)
    return due <= now
  }).length

  // Money at risk this week = overdue invoices due within next 7 days + stale proposal amount
  const atRiskThisWeek = params.invoices.filter((i) => {
    if (i.status === 'paid' || i.status === 'cancelled') return false
    const due = new Date(i.due_date)
    return due >= now && due <= endOfWeek
  })
  const moneyAtRiskThisWeek =
    atRiskThisWeek.reduce((sum, i) => sum + (i.amount - i.amount_paid), 0) +
    totalOverdueAmount

  return {
    totalUnpaidAmount,
    totalOverdueAmount,
    overdueCount,
    staleProposalsCount,
    staleProposalsAmount,
    ghostedLeadsCount,
    followUpsDueToday,
    moneyAtRiskThisWeek,
  }
}
