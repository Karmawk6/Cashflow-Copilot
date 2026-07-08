import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { formatCurrency, formatDate, daysAgo } from '@/lib/utils'
import { updateProposalAction } from '@/lib/actions/proposals'
import { ProposalForm } from '@/components/proposals/proposal-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProposalStatusBadge } from '@/components/shared/status-badge'
import { PrioritySelect } from '@/components/shared/priority-select'
import { updateProposalPriorityAction } from '@/lib/actions/proposals'
import { AiEmailButton } from '@/components/shared/ai-email-button'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('proposals').select('title').eq('id', id).single()
  return { title: data?.title ?? 'Proposal' }
}

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  const [{ data: proposal }, { data: clients }] = await Promise.all([
    supabase
      .from('proposals')
      .select('*, client:clients(*)')
      .eq('id', id)
      .eq('organization_id', org.id)
      .single(),
    supabase.from('clients').select('*').eq('organization_id', org.id).order('company_name'),
  ])

  if (!proposal) notFound()

  const updateAction = updateProposalAction.bind(null, id)
  const client = proposal.client as unknown as { company_name: string; contact_name?: string; email?: string } | null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/proposals"><ArrowLeft className="h-4 w-4 mr-1" /> Proposals</Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{proposal.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <ProposalStatusBadge status={proposal.status} />
            <PrioritySelect
              priority={proposal.priority}
              action={updateProposalPriorityAction.bind(null, proposal.id)}
              autoLabel="Auto (by age)"
            />
            <span className="text-sm text-muted-foreground">
              {client?.company_name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AiEmailButton
            type="proposal_followup"
            clientName={client?.company_name ?? ''}
            clientEmail={client?.email}
            amount={proposal.amount}
            currency={proposal.currency}
            proposalTitle={proposal.title}
            sentDate={proposal.sent_date}
          />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-2xl font-bold tabular-nums">{formatCurrency(proposal.amount, proposal.currency)}</div>
          <div className="text-xs text-muted-foreground mt-1">Proposal value</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-semibold">{proposal.sent_date ? formatDate(proposal.sent_date) : '—'}</div>
              <div className="text-xs text-muted-foreground">Sent date</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-semibold">
                {proposal.sent_date ? `${daysAgo(proposal.sent_date)} days ago` : 'Not sent'}
              </div>
              <div className="text-xs text-muted-foreground">Age</div>
            </div>
          </div>
        </Card>
      </div>

      <ProposalForm proposal={proposal} clients={clients ?? []} action={updateAction} title="Edit proposal" />
    </div>
  )
}
