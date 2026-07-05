import { NextResponse } from 'next/server'
import { createClient, getOrganization } from '@/lib/supabase/server'

// Demo data is org-scoped, so any authenticated account may load it in any
// environment. Clients are tagged 'demo' and activities carry metadata.demo
// so DELETE can remove exactly what POST created.

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await getOrganization()
  if (!org) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .eq('organization_id', org.id)
    .contains('tags', ['demo'])
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: 'Demo data is already loaded. Clear it before loading again.' },
      { status: 409 }
    )
  }

  const now = new Date()
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString().split('T')[0]

  // Create demo clients
  const { data: clients } = await supabase.from('clients').insert([
    { organization_id: org.id, company_name: 'Meridian Growth Partners', contact_name: 'Sarah Chen', email: 'sarah@meridian.example.com', status: 'active', last_contact_date: daysAgo(2), tags: ['demo'] },
    { organization_id: org.id, company_name: 'BlueStone Digital', contact_name: 'Marcus Reid', email: 'marcus@bluestone.example.com', status: 'active', last_contact_date: daysAgo(12), tags: ['demo'] },
    { organization_id: org.id, company_name: 'Vertex Solutions LLC', contact_name: 'Priya Patel', email: 'priya@vertex.example.com', status: 'ghosted', last_contact_date: daysAgo(18), tags: ['demo'] },
    { organization_id: org.id, company_name: 'Harlow & Associates', contact_name: 'Tom Harlow', email: 'tom@harlow.example.com', status: 'active', last_contact_date: daysAgo(5), tags: ['demo'] },
    { organization_id: org.id, company_name: 'Cascade Media Group', contact_name: 'Lisa Park', email: 'lisa@cascade.example.com', status: 'prospect', last_contact_date: daysAgo(8), tags: ['demo'] },
  ]).select()

  if (!clients) return NextResponse.json({ error: 'Failed to create clients' }, { status: 500 })

  const [meridian, bluestone, vertex, harlow, cascade] = clients

  // Recurring schedules: an ongoing retainer and a CDFI-style payment plan.
  // Due dates sit outside the reminder window so the demo stays stable.
  const anchorOf = (dateOnly: string) => Number(dateOnly.split('-')[2])
  const retainerDue = daysAgo(-20)
  const planDue = daysAgo(-10)
  const { data: schedules } = await supabase.from('recurring_schedules').insert([
    {
      organization_id: org.id, client_id: harlow.id,
      title: 'Monthly consulting retainer', kind: 'retainer',
      amount: 5000, currency: 'USD', frequency: 'monthly',
      next_due_date: retainerDue, anchor_day: anchorOf(retainerDue),
      installments_generated: 1, remind_days_before: 3, status: 'active',
    },
    {
      organization_id: org.id, client_id: vertex.id,
      title: 'Equipment loan repayment', kind: 'payment_plan',
      amount: 1250, currency: 'USD', frequency: 'monthly',
      next_due_date: planDue, anchor_day: anchorOf(planDue),
      total_installments: 24, installments_generated: 7,
      remind_days_before: 5, status: 'active',
    },
  ]).select()

  const retainerSchedule = schedules?.[0]

  // Create invoices
  await supabase.from('invoices').insert([
    {
      organization_id: org.id, client_id: meridian.id,
      invoice_number: 'INV-2025-001', title: 'Strategy Consulting — Q2',
      amount: 12500, amount_paid: 0, issue_date: daysAgo(45), due_date: daysAgo(15),
      status: 'overdue', priority: 'high', currency: 'USD',
    },
    {
      organization_id: org.id, client_id: bluestone.id,
      invoice_number: 'INV-2025-002', title: 'Brand Identity Project',
      amount: 8750, amount_paid: 0, issue_date: daysAgo(30), due_date: daysAgo(2),
      status: 'overdue', priority: 'medium', currency: 'USD',
    },
    {
      organization_id: org.id, client_id: harlow.id,
      invoice_number: 'INV-2025-003', title: 'Monthly consulting retainer — June',
      amount: 5000, amount_paid: 0, issue_date: daysAgo(10), due_date: daysAgo(0),
      status: 'sent', priority: 'medium', currency: 'USD',
      recurring_schedule_id: retainerSchedule?.id ?? null,
    },
    {
      organization_id: org.id, client_id: meridian.id,
      invoice_number: 'INV-2025-004', title: 'Workshop Facilitation',
      amount: 3200, amount_paid: 3200, issue_date: daysAgo(60), due_date: daysAgo(30),
      status: 'paid', priority: 'low', currency: 'USD',
    },
  ])

  // Create proposals
  await supabase.from('proposals').insert([
    {
      organization_id: org.id, client_id: cascade.id,
      title: 'Digital Marketing Strategy — 6 Month Engagement',
      proposal_number: 'PROP-2025-001',
      amount: 24000, currency: 'USD',
      sent_date: daysAgo(9), status: 'sent', priority: 'medium',
      follow_up_cadence_days: 3,
    },
    {
      organization_id: org.id, client_id: vertex.id,
      title: 'Operations Consulting Package',
      proposal_number: 'PROP-2025-002',
      amount: 18500, currency: 'USD',
      sent_date: daysAgo(16), status: 'follow_up_due', priority: 'high',
      follow_up_cadence_days: 5,
    },
    {
      organization_id: org.id, client_id: bluestone.id,
      title: 'Website Redesign + Dev',
      proposal_number: 'PROP-2025-003',
      amount: 15000, currency: 'USD',
      sent_date: daysAgo(4), status: 'viewed', priority: 'low',
      follow_up_cadence_days: 3,
    },
    {
      organization_id: org.id, client_id: harlow.id,
      title: 'Content Strategy Audit',
      proposal_number: 'PROP-2025-004',
      amount: 6500, currency: 'USD',
      sent_date: daysAgo(30), status: 'won', priority: 'low',
      follow_up_cadence_days: 3,
    },
  ])

  // Log some activity
  await supabase.from('activities').insert([
    { organization_id: org.id, user_id: user.id, type: 'invoice_created', entity_type: 'invoice', description: 'Created invoice INV-2025-001 for Meridian Growth Partners', metadata: { amount: 12500, demo: true } },
    { organization_id: org.id, user_id: user.id, type: 'proposal_won', entity_type: 'proposal', description: 'Won proposal: Content Strategy Audit (Harlow & Associates)', metadata: { amount: 6500, demo: true } },
    { organization_id: org.id, user_id: user.id, type: 'invoice_paid', entity_type: 'invoice', description: 'Invoice INV-2025-004 marked paid — $3,200', metadata: { amount: 3200, demo: true } },
    { organization_id: org.id, user_id: user.id, type: 'email_drafted', entity_type: 'invoice', description: 'Drafted follow-up for INV-2025-001 (Meridian)', metadata: { demo: true } },
  ])

  return NextResponse.json({ ok: true, message: 'Demo data seeded successfully' })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await getOrganization()
  if (!org) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const { data: demoClients } = await supabase
    .from('clients')
    .select('id')
    .eq('organization_id', org.id)
    .contains('tags', ['demo'])

  const clientIds = (demoClients ?? []).map((c) => c.id)

  if (clientIds.length > 0) {
    const [{ data: invoices }, { data: proposals }] = await Promise.all([
      supabase.from('invoices').select('id').eq('organization_id', org.id).in('client_id', clientIds),
      supabase.from('proposals').select('id').eq('organization_id', org.id).in('client_id', clientIds),
    ])
    const invoiceIds = (invoices ?? []).map((i) => i.id)
    const proposalIds = (proposals ?? []).map((p) => p.id)

    // follow_up_events FKs are ON DELETE SET NULL, so remove them explicitly
    // before the client delete cascades through invoices/proposals.
    await supabase.from('follow_up_events').delete().eq('organization_id', org.id).in('client_id', clientIds)
    if (invoiceIds.length > 0) {
      await supabase.from('follow_up_events').delete().eq('organization_id', org.id).in('invoice_id', invoiceIds)
    }
    if (proposalIds.length > 0) {
      await supabase.from('follow_up_events').delete().eq('organization_id', org.id).in('proposal_id', proposalIds)
    }

    await supabase.from('clients').delete().eq('organization_id', org.id).in('id', clientIds)
  }

  await supabase.from('activities').delete().eq('organization_id', org.id).contains('metadata', { demo: true })

  return NextResponse.json({ ok: true, removedClients: clientIds.length })
}
