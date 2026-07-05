import { redirect } from 'next/navigation'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign, Receipt, FileText, CheckCircle } from 'lucide-react'

export const metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/onboarding')

  const [
    { data: invoices },
    { data: proposals },
    { data: followUps },
    { data: activities },
  ] = await Promise.all([
    supabase.from('invoices').select('*').eq('organization_id', org.id),
    supabase.from('proposals').select('*').eq('organization_id', org.id),
    supabase.from('follow_up_events').select('*').eq('organization_id', org.id),
    supabase.from('activities').select('*').eq('organization_id', org.id).order('created_at', { ascending: false }).limit(100),
  ])

  // Revenue metrics
  const paidInvoices = (invoices ?? []).filter(i => i.status === 'paid')
  const recoveredRevenue = paidInvoices.reduce((sum, i) => sum + i.amount, 0)
  const overdueAmount = (invoices ?? [])
    .filter(i => i.status === 'overdue' || (i.status !== 'paid' && i.status !== 'cancelled' && i.status !== 'draft' && new Date(i.due_date) < new Date()))
    .reduce((sum, i) => sum + (i.amount - i.amount_paid), 0)

  // Follow-up metrics
  const completedFollowUps = (followUps ?? []).filter(f => f.status === 'completed' || f.status === 'sent')
  const totalFollowUps = (followUps ?? []).length
  const followUpCompletionRate = totalFollowUps > 0 ? Math.round((completedFollowUps.length / totalFollowUps) * 100) : 0

  // Invoice payment speed (average days from issue to paid)
  const paidWithDates = paidInvoices.filter(i => i.issue_date && i.updated_at)
  const avgDaysToPayment = paidWithDates.length > 0
    ? Math.round(paidWithDates.reduce((sum, i) => {
        const issue = new Date(i.issue_date)
        const paid = new Date(i.updated_at)
        return sum + (paid.getTime() - issue.getTime()) / (1000 * 60 * 60 * 24)
      }, 0) / paidWithDates.length)
    : 0

  // Proposal win rate
  const decidedProposals = (proposals ?? []).filter(p => p.status === 'won' || p.status === 'lost')
  const wonProposals = (proposals ?? []).filter(p => p.status === 'won')
  const proposalWinRate = decidedProposals.length > 0
    ? Math.round((wonProposals.length / decidedProposals.length) * 100)
    : 0
  const wonRevenue = wonProposals.reduce((sum, p) => sum + p.amount, 0)

  // Invoice status breakdown
  const statusCounts = (invoices ?? []).reduce<Record<string, number>>((acc, i) => {
    acc[i.status] = (acc[i.status] ?? 0) + 1
    return acc
  }, {})

  // Monthly invoice volumes (last 6 months)
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      year: d.getFullYear(),
      month: d.getMonth(),
    }
  })

  const monthlyData = months.map(m => {
    const monthInvoices = (invoices ?? []).filter(i => {
      const d = new Date(i.issue_date)
      return d.getFullYear() === m.year && d.getMonth() === m.month
    })
    return {
      label: m.label,
      invoiced: monthInvoices.reduce((sum, i) => sum + i.amount, 0),
      paid: monthInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0),
      count: monthInvoices.length,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Business performance overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Recovered Revenue"
          value={formatCurrency(recoveredRevenue)}
          icon={DollarSign}
          iconColor="text-success"
          description={`${paidInvoices.length} invoice${paidInvoices.length !== 1 ? 's' : ''} paid`}
        />
        <MetricCard
          title="Overdue Amount"
          value={formatCurrency(overdueAmount)}
          icon={Receipt}
          iconColor="text-destructive"
          description={`${statusCounts.overdue ?? 0} overdue invoices`}
          valueColor="text-destructive"
        />
        <MetricCard
          title="Proposal Win Rate"
          value={`${proposalWinRate}%`}
          icon={FileText}
          iconColor="text-primary"
          description={`${wonProposals.length} won · ${formatCurrency(wonRevenue)}`}
        />
        <MetricCard
          title="Follow-Up Rate"
          value={`${followUpCompletionRate}%`}
          icon={CheckCircle}
          iconColor="text-warning"
          description={`${completedFollowUps.length} of ${totalFollowUps} completed`}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Invoice Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Invoice Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { status: 'paid', label: 'Paid', color: 'bg-success' },
                { status: 'sent', label: 'Sent', color: 'bg-primary' },
                { status: 'overdue', label: 'Overdue', color: 'bg-destructive' },
                { status: 'partially_paid', label: 'Partially Paid', color: 'bg-warning' },
                { status: 'draft', label: 'Draft', color: 'bg-muted' },
                { status: 'cancelled', label: 'Cancelled', color: 'bg-muted-foreground/30' },
              ].map(({ status, label, color }) => {
                const count = statusCounts[status] ?? 0
                const total = (invoices ?? []).length
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${color} shrink-0`} />
                    <div className="flex-1 text-sm">{label}</div>
                    <div className="text-sm text-muted-foreground">{count}</div>
                    <div className="w-16">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground w-8 text-right">{pct}%</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Average Days to Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Payment Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <div className="text-3xl font-bold">{avgDaysToPayment}</div>
                <div className="text-sm text-muted-foreground mt-1">Avg. days to payment</div>
              </div>
              <TrendingUp className={`h-8 w-8 ${avgDaysToPayment <= 30 ? 'text-success' : avgDaysToPayment <= 60 ? 'text-warning' : 'text-destructive'}`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-xl font-bold">{(invoices ?? []).length}</div>
                <div className="text-xs text-muted-foreground">Total invoices</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xl font-bold">{(proposals ?? []).length}</div>
                <div className="text-xs text-muted-foreground">Total proposals</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Invoice Volume */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Monthly Invoice Volume (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-3">
            {monthlyData.map((m) => {
              const maxAmount = Math.max(...monthlyData.map(d => d.invoiced), 1)
              const invoicedPct = (m.invoiced / maxAmount) * 100
              const paidPct = (m.paid / maxAmount) * 100
              return (
                <div key={m.label} className="text-center">
                  <div className="flex flex-col-reverse gap-1 h-24 items-center justify-start mb-2">
                    <div className="w-8 relative">
                      <div
                        className="bg-primary/20 rounded-sm w-full absolute bottom-0"
                        style={{ height: `${invoicedPct}%`, minHeight: m.invoiced > 0 ? '4px' : '0' }}
                      />
                      <div
                        className="bg-success rounded-sm w-full absolute bottom-0"
                        style={{ height: `${paidPct}%`, minHeight: m.paid > 0 ? '4px' : '0' }}
                      />
                    </div>
                  </div>
                  <div className="text-xs font-medium">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.count} inv</div>
                  {m.invoiced > 0 && (
                    <div className="text-xs text-primary font-medium">{formatCurrency(m.invoiced)}</div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-primary/20" /> Invoiced</div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-success" /> Paid</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon: Icon,
  iconColor,
  description,
  valueColor,
}: {
  title: string
  value: string
  icon: typeof DollarSign
  iconColor: string
  description: string
  valueColor?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor ?? ''}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}
