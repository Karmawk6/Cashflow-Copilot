import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  invoiceNeedsFollowUp,
  proposalNeedsFollowUp,
} from '@/lib/follow-up-engine/engine'
import { generateDueInvoices } from '@/lib/follow-up-engine/recurring'
import { syncInvoiceStatusAndPriority, syncProposalStatusAndPriority } from '@/lib/follow-up-engine/sync'
import type { Database, RecurringSchedule } from '@/types/database'

// Vercel Cron: configured in vercel.json, runs daily.
// Vercel sends `Authorization: Bearer ${CRON_SECRET}`; the x-cron-secret header
// is kept for manual/legacy invocation.

export async function GET(request: Request) {
  // Fail closed: never run without a configured, matching secret.
  const secret = process.env.CRON_SECRET
  const bearer = request.headers.get('authorization')
  const legacy = request.headers.get('x-cron-secret')
  if (!secret || (bearer !== `Bearer ${secret}` && legacy !== secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // The cron has no user session, so RLS would hide every row from the anon
  // key. It must use the service-role key (server-only env var).
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is not set — the cron cannot read any data without it' },
      { status: 500 }
    )
  }

  const supabase = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  })

  const { data: organizations } = await supabase.from('organizations').select('id')
  if (!organizations) return NextResponse.json({ processed: 0 })

  let totalCreated = 0
  let totalUpdated = 0
  let totalGenerated = 0

  for (const org of organizations) {
    // ------------------------------------------------------------------
    // 1) Recurring schedules → generate invoices that are (about to be) due
    // ------------------------------------------------------------------
    const { data: schedules } = await supabase
      .from('recurring_schedules')
      .select('*')
      .eq('organization_id', org.id)
      .eq('status', 'active')

    for (const schedule of schedules ?? []) {
      const { generated } = await generateDueInvoices(supabase, schedule as RecurringSchedule)
      totalGenerated += generated
    }

    // ------------------------------------------------------------------
    // 2) Invoices → escalate priorities, mark overdue, queue reminders
    // ------------------------------------------------------------------
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

    const now = new Date().toISOString()

    for (const invoice of invoices ?? []) {
      const { status: newStatus, priority: newPriority, changed } = await syncInvoiceStatusAndPriority(supabase, invoice)
      const isNowOverdue = newStatus === 'overdue' && invoice.status !== 'overdue'

      if (changed) totalUpdated++

      if (isNowOverdue) {
        // A pending "upcoming payment" heads-up is moot once the payment is
        // missed — retire it so the overdue reminder replaces it.
        await supabase
          .from('follow_up_events')
          .update({ status: 'skipped', notes: 'Superseded: payment became overdue' })
          .eq('invoice_id', invoice.id)
          .eq('type', 'payment_upcoming')
          .eq('status', 'pending')
      }

      // Create follow-up event if needed
      if (invoiceNeedsFollowUp(invoice.due_date, invoice.status, invoice.last_reminder_date)) {
        const { data: existing } = await supabase
          .from('follow_up_events')
          .select('id')
          .eq('invoice_id', invoice.id)
          .eq('type', 'invoice_reminder')
          .eq('status', 'pending')
          .maybeSingle()

        if (!existing) {
          await supabase.from('follow_up_events').insert({
            organization_id: org.id,
            client_id: invoice.client_id,
            invoice_id: invoice.id,
            type: 'invoice_reminder',
            status: 'pending',
            priority: newPriority,
            due_date: now,
          })
          totalCreated++
        }
      }
    }

    // ------------------------------------------------------------------
    // 3) Proposals → escalate stale ones and queue follow-ups
    // ------------------------------------------------------------------
    for (const proposal of proposals ?? []) {
      const { priority: newPriority, changed } = await syncProposalStatusAndPriority(supabase, proposal)
      if (changed) totalUpdated++

      if (proposalNeedsFollowUp(proposal.sent_date, proposal.status, proposal.last_follow_up_date, proposal.follow_up_cadence_days)) {
        const { data: existing } = await supabase
          .from('follow_up_events')
          .select('id')
          .eq('proposal_id', proposal.id)
          .eq('type', 'proposal_followup')
          .eq('status', 'pending')
          .maybeSingle()

        if (!existing) {
          await supabase.from('follow_up_events').insert({
            organization_id: org.id,
            client_id: proposal.client_id,
            proposal_id: proposal.id,
            type: 'proposal_followup',
            status: 'pending',
            priority: newPriority,
            due_date: now,
          })
          totalCreated++
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    organizations: organizations.length,
    invoicesGenerated: totalGenerated,
    followUpsCreated: totalCreated,
    recordsUpdated: totalUpdated,
    timestamp: new Date().toISOString(),
  })
}
