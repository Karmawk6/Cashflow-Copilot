import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { syncOrgWorkState } from '@/lib/follow-up-engine/sync'
import { formatCurrency, formatDate, daysAgo } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ProposalStatusBadge } from '@/components/shared/status-badge'
import { PriorityBadge } from '@/components/shared/priority-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, FileText } from 'lucide-react'

export const metadata = { title: 'Proposals' }

export default async function ProposalsPage() {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/onboarding')

  // Bring overdue status & priorities up to date before fetching what we show
  await syncOrgWorkState(supabase, org.id)

  const { data: proposals } = await supabase
    .from('proposals')
    .select('*, client:clients(company_name)')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })

  const totalValue = (proposals ?? []).filter(p => p.status !== 'lost').reduce((sum, p) => sum + p.amount, 0)
  const wonValue = (proposals ?? []).filter(p => p.status === 'won').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proposals</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {formatCurrency(wonValue)} won · {formatCurrency(totalValue)} in pipeline
          </p>
        </div>
        <Button asChild>
          <Link href="/proposals/new">
            <Plus className="h-4 w-4 mr-2" />
            New proposal
          </Link>
        </Button>
      </div>

      {!proposals || proposals.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No proposals yet"
          description="Create your first proposal to start tracking client opportunities."
          action={{ label: 'New proposal', href: '/proposals/new' }}
        />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proposal</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(proposals ?? []).map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{proposal.title}</div>
                      {proposal.proposal_number && (
                        <div className="text-xs text-muted-foreground">{proposal.proposal_number}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(proposal.client as unknown as { company_name: string } | null)?.company_name ?? '—'}
                  </TableCell>
                  <TableCell className="tabular-nums font-medium">
                    {formatCurrency(proposal.amount, proposal.currency)}
                  </TableCell>
                  <TableCell>
                    <ProposalStatusBadge status={proposal.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={proposal.priority} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {proposal.sent_date ? `${daysAgo(proposal.sent_date)}d ago` : '—'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/proposals/${proposal.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
