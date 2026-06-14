import { NextResponse } from 'next/server'
import { createClient, getOrganization } from '@/lib/supabase/server'

// Seed demo data for testing. Only works in development or demo mode.
export async function POST() {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'Seed disabled in production' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await getOrganization()
  if (!org) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const now = new Date()
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString().split('T')[0]

  // Create demo clients
  const { data: clients } = await supabase.from('clients').insert([
    { organization_id: org.id, company_name: 'Meridian Growth Partners', contact_name: 'Sarah Chen', email: 'sarah@meridian.example.com', status: 'active', last_contact_date: daysAgo(2) },
    { organization_id: org.id, company_name: 'BlueStone Digital', contact_name: 'Marcus Reid', email: 'marcus@bluestone.example.com', status: 'active', last_contact_date: daysAgo(12) },
    { organization_id: org.id, company_name: 'Vertex Solutions LLC', contact_name: 'Priya Patel', email: 'priya@vertex.example.com', status: 'ghosted', last_contact_date: daysAgo(18) },
    { organization_id: org.id, company_name: 'Harlow & Associates', contact_name: 'Tom Harlow', email: 'tom@harlow.example.com', status: 'active', last_contact_date: daysAgo(5) },
    { organization_id: org.id, company_name: 'Cascade Media Group', contact_name: 'Lisa Park', email: 'lisa@cascade.example.com', status: 'prospect', last_contact_date: daysAgo(8) },
  ]).select()

  if (!clients) return NextResponse.json({ error: 'Failed to create clients' }, { status: 500 })

  const [meridian, bluestone, vertex, harlow, cascade] = clients

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
      invoice_number: 'INV-2025-003', title: 'Annual Retainer — June',
      amount: 5000, amount_paid: 0, issue_date: daysAgo(10), due_date: daysAgo(0),
      status: 'sent', priority: 'medium', currency: 'USD',
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
    { organization_id: org.id, user_id: user.id, type: 'invoice_created', entity_type: 'invoice', description: 'Created invoice INV-2025-001 for Meridian Growth Partners', metadata: { amount: 12500 } },
    { organization_id: org.id, user_id: user.id, type: 'proposal_won', entity_type: 'proposal', description: 'Won proposal: Content Strategy Audit (Harlow & Associates)', metadata: { amount: 6500 } },
    { organization_id: org.id, user_id: user.id, type: 'invoice_paid', entity_type: 'invoice', description: 'Invoice INV-2025-004 marked paid — $3,200', metadata: { amount: 3200 } },
    { organization_id: org.id, user_id: user.id, type: 'email_drafted', entity_type: 'invoice', description: 'Drafted follow-up for INV-2025-001 (Meridian)', metadata: {} },
  ])

  return NextResponse.json({ ok: true, message: 'Demo data seeded successfully' })
}
