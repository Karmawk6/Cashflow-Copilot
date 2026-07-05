import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PriorityBadge } from '@/components/shared/priority-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { FollowUpActions } from '@/components/follow-ups/follow-up-actions'
import { Bell, CheckCircle, SkipForward, Receipt, FileText, Ghost, CalendarClock } from 'lucide-react'

export const metadata = { title: 'Follow-Ups' }

export default async function FollowUpsPage() {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/onboarding')

  const { data: followUps } = await supabase
    .from('follow_up_events')
    .select(`
      *,
      client:clients(company_name, contact_name, email),
      invoice:invoices(invoice_number, amount, due_date, payment_link, currency),
      proposal:proposals(title, amount, currency)
    `)
    .eq('organization_id', org.id)
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('due_date', { ascending: true })

  const typeIcon = {
    invoice_reminder: Receipt,
    proposal_followup: FileText,
    ghosted_checkin: Ghost,
    payment_upcoming: CalendarClock,
  }

  const typeLabel = {
    invoice_reminder: 'Invoice Reminder',
    proposal_followup: 'Proposal Follow-Up',
    ghosted_checkin: 'Check-In',
    payment_upcoming: 'Upcoming Payment',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Follow-Ups</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {followUps?.length ?? 0} pending follow-up{(followUps?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {!followUps || followUps.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up!"
          description="No follow-ups pending right now. The system will automatically detect new items that need attention."
        />
      ) : (
        <div className="space-y-3">
          {followUps.map((fu) => {
            const client = fu.client as unknown as { company_name: string; contact_name?: string; email?: string } | null
            const invoice = fu.invoice as unknown as { invoice_number: string; amount: number; due_date: string; payment_link?: string; currency: string } | null
            const proposal = fu.proposal as unknown as { title: string; amount: number; currency: string } | null
            const Icon = typeIcon[fu.type as keyof typeof typeIcon] ?? Bell

            return (
              <Card key={fu.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-muted-foreground">
                            {typeLabel[fu.type as keyof typeof typeLabel]}
                          </span>
                          <PriorityBadge priority={fu.priority} />
                        </div>
                        <div className="font-medium mt-0.5">
                          {client?.company_name ?? 'Unknown client'}
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {invoice && <>Invoice #{invoice.invoice_number} — {formatCurrency(invoice.amount, invoice.currency)}</>}
                          {proposal && <>{proposal.title} — {formatCurrency(proposal.amount, proposal.currency)}</>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <FollowUpActions
                        followUpId={fu.id}
                        clientName={client?.company_name ?? ''}
                        clientEmail={client?.email}
                        type={fu.type as 'invoice_reminder' | 'proposal_followup' | 'ghosted_checkin' | 'payment_upcoming'}
                        amount={invoice?.amount ?? proposal?.amount}
                        currency={invoice?.currency ?? proposal?.currency}
                        invoiceNumber={invoice?.invoice_number}
                        proposalTitle={proposal?.title}
                        dueDate={invoice?.due_date}
                        paymentLink={invoice?.payment_link}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
