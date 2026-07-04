import { NextResponse } from 'next/server'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send'
import { logActivity } from '@/lib/actions/activities'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { to, subject, body: emailBody, context } = body

    if (!to || !subject || !emailBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const org = await getOrganization()
    if (!org) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 })
    }

    // Only allow sending to a client of the caller's org — otherwise any
    // account can use our verified sending domain as an open relay.
    const { data: recipient } = await supabase
      .from('clients')
      .select('id')
      .eq('organization_id', org.id)
      .eq('email', to)
      .limit(1)
      .maybeSingle()

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient must be the email address of one of your clients' },
        { status: 403 }
      )
    }

    const result = await sendEmail({ to, subject, body: emailBody })

    await logActivity({
      orgId: org.id,
      type: 'email_sent',
      entityType: context?.invoiceId ? 'invoice' : context?.proposalId ? 'proposal' : 'client',
      entityId: context?.invoiceId ?? context?.proposalId ?? context?.clientId,
      description: `Email sent to ${to}: "${subject}"`,
      metadata: { to, subject, demo: result.demo ?? false },
    })

    // Update last reminder date on invoice if applicable
    if (context?.invoiceId) {
      await supabase
        .from('invoices')
        .update({ last_reminder_date: new Date().toISOString() })
        .eq('id', context.invoiceId)
        .eq('organization_id', org.id)
    }

    // Update last follow-up date on proposal if applicable
    if (context?.proposalId) {
      await supabase
        .from('proposals')
        .update({ last_follow_up_date: new Date().toISOString() })
        .eq('id', context.proposalId)
        .eq('organization_id', org.id)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
