import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  invoiceNeedsFollowUp,
  proposalNeedsFollowUp,
  computeInvoicePriority,
  computeProposalPriority,
} from '@/lib/follow-up-engine/engine'

// Vercel Cron: call this endpoint daily via vercel.json cron config
// Also protected by CRON_SECRET header

export async function GET(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  // Use service role for cron — fetch all orgs
  const { data: organizations } = await supabase.from('organizations').select('id')
  if (!organizations) return NextResponse.json({ processed: 0 })

  let totalCreated = 0
  let totalUpdated = 0

  for (const org of organizations) {
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

    // Auto-update overdue invoice statuses
    for (const invoice of invoices ?? []) {
      const newPriority = computeInvoicePriority(invoice.due_date, invoice.status)
      const isNowOverdue = new Date(invoice.due_date) < new Date() && invoice.status === 'sent'

      if (isNowOverdue || newPriority !== invoice.priority) {
        await supabase
          .from('invoices')
          .update({
            status: isNowOverdue ? 'overdue' : invoice.status,
            priority: newPriority,
          })
          .eq('id', invoice.id)
        totalUpdated++
      }

      // Create follow-up event if needed
      if (invoiceNeedsFollowUp(invoice.due_date, invoice.status, invoice.last_reminder_date)) {
        const { data: existing } = await supabase
          .from('follow_up_events')
          .select('id')
          .eq('invoice_id', invoice.id)
          .eq('status', 'pending')
          .single()

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

    // Auto-update stale proposal statuses and create follow-up events
    for (const proposal of proposals ?? []) {
      const newPriority = computeProposalPriority(proposal.sent_date, proposal.status)

      if (newPriority !== proposal.priority) {
        const newStatus = newPriority !== 'low' && proposal.status === 'sent' ? 'follow_up_due' : proposal.status
        await supabase
          .from('proposals')
          .update({ priority: newPriority, status: newStatus })
          .eq('id', proposal.id)
        totalUpdated++
      }

      if (proposalNeedsFollowUp(proposal.sent_date, proposal.status, proposal.last_follow_up_date, proposal.follow_up_cadence_days)) {
        const { data: existing } = await supabase
          .from('follow_up_events')
          .select('id')
          .eq('proposal_id', proposal.id)
          .eq('status', 'pending')
          .single()

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
    followUpsCreated: totalCreated,
    recordsUpdated: totalUpdated,
    timestamp: new Date().toISOString(),
  })
}
