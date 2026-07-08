import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { syncOrgWorkState } from '@/lib/follow-up-engine/sync'
import { formatCurrency, formatDate, daysAgo, isOverdue } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { InvoiceStatusBadge } from '@/components/shared/status-badge'
import { PrioritySelect } from '@/components/shared/priority-select'
import { updateInvoicePriorityAction } from '@/lib/actions/invoices'
import { EmptyState } from '@/components/shared/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RecurringTable } from '@/components/invoices/recurring-table'
import { Plus, Receipt, Repeat } from 'lucide-react'
import type { RecurringScheduleWithClient } from '@/types/database'

export const metadata = { title: 'Invoices' }

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/onboarding')

  // Bring overdue status & priorities up to date before fetching what we show
  await syncOrgWorkState(supabase, org.id)

  const [{ data: invoices }, { data: schedules }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, client:clients(company_name)')
      .eq('organization_id', org.id)
      .order('due_date', { ascending: false }),
    supabase
      .from('recurring_schedules')
      .select('*, client:clients(company_name, contact_name, email)')
      .eq('organization_id', org.id)
      .order('next_due_date', { ascending: true }),
  ])

  const totalUnpaid = (invoices ?? [])
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled' && i.status !== 'draft')
    .reduce((sum, i) => sum + (i.amount - i.amount_paid), 0)

  const overdueCount = (invoices ?? []).filter((i) => isOverdue(i.due_date) && i.status !== 'paid' && i.status !== 'cancelled').length

  const activeSchedules = (schedules ?? []).filter((s) => s.status === 'active')
  const recurringMonthly = activeSchedules
    .filter((s) => s.frequency === 'monthly')
    .reduce((sum, s) => sum + s.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {formatCurrency(totalUnpaid)} unpaid · {overdueCount} overdue
            {activeSchedules.length > 0 && (
              <> · {activeSchedules.length} recurring{recurringMonthly > 0 && <> ({formatCurrency(recurringMonthly)}/mo)</>}</>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/invoices/recurring/new">
              <Repeat className="h-4 w-4 mr-2" />
              New recurring
            </Link>
          </Button>
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="h-4 w-4 mr-2" />
              New invoice
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue={tab === 'recurring' ? 'recurring' : 'all'}>
        <TabsList>
          <TabsTrigger value="all">All invoices</TabsTrigger>
          <TabsTrigger value="recurring">
            Recurring
            {activeSchedules.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 text-xs tabular-nums text-primary">
                {activeSchedules.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {!invoices || invoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No invoices yet"
              description="Create your first invoice to start tracking payments."
              action={{ label: 'New invoice', href: '/invoices/new' }}
            />
          ) : (
            <div className="rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(invoices ?? []).map((invoice) => (
                    <TableRow key={invoice.id} className={isOverdue(invoice.due_date) && invoice.status !== 'paid' ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-1.5">
                            #{invoice.invoice_number}
                            {invoice.recurring_schedule_id && (
                              <Repeat className="h-3 w-3 text-muted-foreground" aria-label="Generated by a recurring schedule" />
                            )}
                          </div>
                          {invoice.title && <div className="text-xs text-muted-foreground">{invoice.title}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {(invoice.client as unknown as { company_name: string } | null)?.company_name ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className="tabular-nums font-medium">{formatCurrency(invoice.amount, invoice.currency)}</div>
                        {invoice.amount_paid > 0 && invoice.status !== 'paid' && (
                          <div className="text-xs text-success">+{formatCurrency(invoice.amount_paid)} paid</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell>
                        <PrioritySelect
                          priority={invoice.priority}
                          action={updateInvoicePriorityAction.bind(null, invoice.id)}
                          autoLabel="Auto (by due date)"
                        />
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className={isOverdue(invoice.due_date) && invoice.status !== 'paid' ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                          {formatDate(invoice.due_date)}
                        </div>
                        {isOverdue(invoice.due_date) && invoice.status !== 'paid' && (
                          <div className="text-xs text-destructive">{daysAgo(invoice.due_date)}d overdue</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/invoices/${invoice.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recurring" className="mt-4">
          {!schedules || schedules.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title="No recurring payments yet"
              description="Set up a retainer or payment plan and each period's invoice will be created and followed up automatically."
              action={{ label: 'New recurring payment', href: '/invoices/recurring/new' }}
            />
          ) : (
            <RecurringTable schedules={schedules as unknown as RecurringScheduleWithClient[]} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
