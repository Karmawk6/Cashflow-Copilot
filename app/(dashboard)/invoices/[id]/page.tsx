import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { formatCurrency, formatDate, daysAgo, isOverdue } from '@/lib/utils'
import { updateInvoiceAction } from '@/lib/actions/invoices'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InvoiceStatusBadge } from '@/components/shared/status-badge'
import { PriorityBadge } from '@/components/shared/priority-badge'
import { AiEmailButton } from '@/components/shared/ai-email-button'
import { MarkPaidButton } from '@/components/invoices/mark-paid-button'
import { DeleteInvoiceButton } from '@/components/invoices/delete-invoice-button'
import { ArrowLeft, Calendar, AlertTriangle } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('invoices').select('invoice_number').eq('id', id).single()
  return { title: data ? `Invoice #${data.invoice_number}` : 'Invoice' }
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  const [{ data: invoice }, { data: clients }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, client:clients(*)')
      .eq('id', id)
      .eq('organization_id', org.id)
      .single(),
    supabase.from('clients').select('*').eq('organization_id', org.id).order('company_name'),
  ])

  if (!invoice) notFound()

  const updateAction = updateInvoiceAction.bind(null, id)
  const client = invoice.client as unknown as { company_name: string; contact_name?: string; email?: string; payment_link?: string } | null
  const overdue = isOverdue(invoice.due_date) && invoice.status !== 'paid'
  const daysOverdueCount = overdue ? daysAgo(invoice.due_date) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/invoices"><ArrowLeft className="h-4 w-4 mr-1" /> Invoices</Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoice #{invoice.invoice_number}</h1>
          <div className="flex items-center gap-3 mt-2">
            <InvoiceStatusBadge status={invoice.status} />
            <PriorityBadge priority={invoice.priority} />
            <span className="text-sm text-muted-foreground">{client?.company_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status !== 'paid' && (
            <>
              <AiEmailButton
                type={daysOverdueCount > 14 ? 'final_nudge' : daysOverdueCount > 7 ? 'second_reminder' : 'invoice_reminder'}
                clientName={client?.company_name ?? ''}
                clientEmail={client?.email}
                amount={invoice.amount - invoice.amount_paid}
                currency={invoice.currency}
                invoiceNumber={invoice.invoice_number}
                dueDate={invoice.due_date}
                daysOverdue={daysOverdueCount}
                paymentLink={invoice.payment_link}
              />
              <MarkPaidButton invoiceId={id} />
            </>
          )}
          <DeleteInvoiceButton invoiceId={id} invoiceNumber={invoice.invoice_number} />
        </div>
      </div>

      {overdue && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <span className="text-sm text-destructive font-medium">
            This invoice is {daysOverdueCount} days overdue. Total owed: {formatCurrency(invoice.amount - invoice.amount_paid, invoice.currency)}
          </span>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-2xl font-bold tabular-nums">{formatCurrency(invoice.amount, invoice.currency)}</div>
          <div className="text-xs text-muted-foreground mt-1">Invoice amount</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold tabular-nums text-success">{formatCurrency(invoice.amount_paid, invoice.currency)}</div>
          <div className="text-xs text-muted-foreground mt-1">Amount paid</div>
        </Card>
        <Card className="p-4">
          <div className={`text-2xl font-bold tabular-nums ${invoice.amount - invoice.amount_paid > 0 ? 'text-warning' : 'text-success'}`}>
            {formatCurrency(invoice.amount - invoice.amount_paid, invoice.currency)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Outstanding</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className={`text-sm font-semibold ${overdue ? 'text-destructive' : ''}`}>
                {formatDate(invoice.due_date)}
              </div>
              <div className="text-xs text-muted-foreground">Due date</div>
            </div>
          </div>
        </Card>
      </div>

      <InvoiceForm invoice={invoice} clients={clients ?? []} action={updateAction} title="Edit invoice" />
    </div>
  )
}
