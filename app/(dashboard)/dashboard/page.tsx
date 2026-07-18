import Link from 'next/link'
import { requireOrgOrRedirect } from '@/lib/supabase/guards'
import { syncOrgWorkState } from '@/lib/follow-up-engine/sync'
import { computeDashboardSummary, isPastDue } from '@/lib/follow-up-engine/engine'
import { formatCurrency, daysAgo } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProposalStatusBadge } from '@/components/shared/status-badge'
import { PriorityBadge } from '@/components/shared/priority-badge'
import {
  DollarSign,
  AlertTriangle,
  FileText,
  Ghost,
  Bell,
  TrendingDown,
  ChevronRight,
  Clock,
  Zap,
} from 'lucide-react'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const { supabase, org } = await requireOrgOrRedirect('/onboarding')

  // Bring overdue status & priorities up to date before fetching what we show
  await syncOrgWorkState(supabase, org.id)

  const [
    { data: invoices },
    { data: proposals },
    { data: clients },
    { data: followUps },
    { data: activities },
  ] = await Promise.all([
    supabase.from('invoices').select('*').eq('organization_id', org.id),
    supabase.from('proposals').select('*, client:clients(company_name, email)').eq('organization_id', org.id),
    supabase.from('clients').select('*').eq('organization_id', org.id),
    supabase.from('follow_up_events').select('*, client:clients(company_name), invoice:invoices(invoice_number, amount), proposal:proposals(title, amount)').eq('organization_id', org.id).eq('status', 'pending').order('due_date', { ascending: true }).limit(10),
    supabase.from('activities').select('*').eq('organization_id', org.id).order('created_at', { ascending: false }).limit(8),
  ])

  const summary = computeDashboardSummary({
    invoices: invoices ?? [],
    proposals: proposals ?? [],
    clients: clients ?? [],
    followUps: followUps ?? [],
  })

  const overdueInvoices = (invoices ?? [])
    .filter((i) => i.status === 'overdue' || (i.status === 'sent' && isPastDue(i.due_date)))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5)

  const staleProposals = (proposals ?? [])
    .filter((p) => p.status === 'follow_up_due' || p.status === 'sent' || p.status === 'viewed')
    .sort((a, b) => (b.amount - a.amount))
    .slice(0, 5)

  // Recommended next actions
  const recommendations: Array<{ icon: typeof Zap; label: string; href: string; priority: 'high' | 'medium' }> = []
  if (summary.overdueCount > 0) {
    recommendations.push({ icon: AlertTriangle, label: `${summary.overdueCount} overdue invoice${summary.overdueCount > 1 ? 's' : ''} need attention`, href: '/invoices?filter=overdue', priority: 'high' })
  }
  if (summary.staleProposalsCount > 0) {
    recommendations.push({ icon: FileText, label: `${summary.staleProposalsCount} proposal${summary.staleProposalsCount > 1 ? 's' : ''} waiting for follow-up`, href: '/proposals?filter=stale', priority: 'medium' })
  }
  if (summary.followUpsDueToday > 0) {
    recommendations.push({ icon: Bell, label: `${summary.followUpsDueToday} follow-up${summary.followUpsDueToday > 1 ? 's' : ''} due today`, href: '/follow-ups', priority: 'high' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Here&apos;s where your money stands today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Unpaid Invoices"
          value={formatCurrency(summary.totalUnpaidAmount)}
          icon={DollarSign}
          iconColor="text-primary"
          description={`${(invoices ?? []).filter(i => i.status !== 'paid' && i.status !== 'cancelled' && i.status !== 'draft').length} outstanding`}
        />
        <StatCard
          title="Overdue Amount"
          value={formatCurrency(summary.totalOverdueAmount)}
          icon={AlertTriangle}
          iconColor="text-destructive"
          description={`${summary.overdueCount} invoice${summary.overdueCount !== 1 ? 's' : ''} overdue`}
          valueClassName={summary.totalOverdueAmount > 0 ? 'text-destructive' : undefined}
        />
        <StatCard
          title="Stale Proposals"
          value={formatCurrency(summary.staleProposalsAmount)}
          icon={FileText}
          iconColor="text-warning"
          description={`${summary.staleProposalsCount} need follow-up`}
        />
        <StatCard
          title="Money at Risk"
          value={formatCurrency(summary.moneyAtRiskThisWeek)}
          icon={TrendingDown}
          iconColor="text-warning"
          description="This week"
          valueClassName={summary.moneyAtRiskThisWeek > 0 ? 'text-warning' : undefined}
        />
      </div>

      {/* Secondary stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-5/10">
              <Ghost className="h-5 w-5 text-chart-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{summary.ghostedLeadsCount}</div>
              <div className="text-xs text-muted-foreground">Ghosted leads</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
              <Bell className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <div className="text-2xl font-bold">{summary.followUpsDueToday}</div>
              <div className="text-xs text-muted-foreground">Follow-ups due today</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold">{(clients ?? []).length}</div>
              <div className="text-xs text-muted-foreground">Total clients</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recommended Actions */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Recommended Next Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendations.map((rec, i) => {
              const Icon = rec.icon
              return (
                <Link
                  key={i}
                  href={rec.href}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${rec.priority === 'high' ? 'text-destructive' : 'text-warning'}`} />
                    <span>{rec.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              )
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">Overdue Invoices</CardTitle>
            <Link href="/invoices?filter=overdue" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {overdueInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No overdue invoices</p>
            ) : (
              <div className="space-y-3">
                {overdueInvoices.map((invoice) => (
                  <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">#{invoice.invoice_number}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {daysAgo(invoice.due_date)}d overdue
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <PriorityBadge priority={invoice.priority} />
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(invoice.amount - invoice.amount_paid, invoice.currency)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stale Proposals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">Proposals Needing Attention</CardTitle>
            <Link href="/proposals" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {staleProposals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">All proposals up to date</p>
            ) : (
              <div className="space-y-3">
                {staleProposals.map((proposal) => (
                  <Link key={proposal.id} href={`/proposals/${proposal.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{proposal.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {(proposal.client as unknown as { company_name: string } | null)?.company_name} •{' '}
                          {proposal.sent_date ? `Sent ${daysAgo(proposal.sent_date)}d ago` : 'Not sent'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <ProposalStatusBadge status={proposal.status} />
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(proposal.amount, proposal.currency)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      {(activities ?? []).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(activities ?? []).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {daysAgo(activity.created_at) === 0
                        ? 'Today'
                        : daysAgo(activity.created_at) === 1
                        ? 'Yesterday'
                        : `${daysAgo(activity.created_at)} days ago`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  description,
  valueClassName,
}: {
  title: string
  value: string
  icon: typeof DollarSign
  iconColor: string
  description: string
  valueClassName?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold tabular-nums ${valueClassName ?? ''}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}
