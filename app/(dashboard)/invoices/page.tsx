import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { formatCurrency, formatDate, daysAgo, isOverdue } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { InvoiceStatusBadge } from '@/components/shared/status-badge'
import { PriorityBadge } from '@/components/shared/priority-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Receipt } from 'lucide-react'

export const metadata = { title: 'Invoices' }

export default async function InvoicesPage() {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/onboarding')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, client:clients(company_name)')
    .eq('organization_id', org.id)
    .order('due_date', { ascending: false })

  const totalUnpaid = (invoices ?? [])
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled' && i.status !== 'draft')
    .reduce((sum, i) => sum + (i.amount - i.amount_paid), 0)

  const overdueCount = (invoices ?? []).filter((i) => isOverdue(i.due_date) && i.status !== 'paid' && i.status !== 'cancelled').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {formatCurrency(totalUnpaid)} unpaid · {overdueCount} overdue
          </p>
        </div>
        <Button asChild>
          <Link href="/invoices/new">
            <Plus className="h-4 w-4 mr-2" />
            New invoice
          </Link>
        </Button>
      </div>

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
                      <div className="font-medium">#{invoice.invoice_number}</div>
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
                    <PriorityBadge priority={invoice.priority} />
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
    </div>
  )
}
