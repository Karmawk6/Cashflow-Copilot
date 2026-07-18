import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { updateClientAction, deleteClientAction } from '@/lib/actions/clients'
import { ClientForm } from '@/components/clients/client-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientStatusBadge, InvoiceStatusBadge, ProposalStatusBadge } from '@/components/shared/status-badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Mail, Globe } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('clients').select('company_name').eq('id', id).single()
  return { title: data?.company_name ?? 'Client' }
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('organization_id', org.id)
    .single()

  if (!client) notFound()

  const [{ data: invoices }, { data: proposals }] = await Promise.all([
    supabase.from('invoices').select('*').eq('client_id', id).order('due_date', { ascending: false }),
    supabase.from('proposals').select('*').eq('client_id', id).order('created_at', { ascending: false }),
  ])

  const updateAction = updateClientAction.bind(null, id)

  const totalInvoiced = (invoices ?? []).reduce((sum, i) => sum + i.amount, 0)
  const totalPaid = (invoices ?? []).filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/clients"><ArrowLeft className="h-4 w-4 mr-1" /> Clients</Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{client.company_name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <ClientStatusBadge status={client.status} />
            {client.email && (
              <a href={`mailto:${client.email}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                <Mail className="h-3.5 w-3.5" />
                {client.email}
              </a>
            )}
            {client.website && (
              <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                <Globe className="h-3.5 w-3.5" />
                Website
              </a>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/invoices/new?client=${id}`}>New Invoice</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/proposals/new?client=${id}`}>New Proposal</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-2xl font-bold">{formatCurrency(totalInvoiced)}</div>
          <div className="text-xs text-muted-foreground mt-1">Total invoiced</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-success">{formatCurrency(totalPaid)}</div>
          <div className="text-xs text-muted-foreground mt-1">Total paid</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-warning">{formatCurrency(totalInvoiced - totalPaid)}</div>
          <div className="text-xs text-muted-foreground mt-1">Outstanding</div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Edit form */}
        <div className="lg:col-span-3">
          <ClientForm client={client} action={updateAction} title="Edit client" />
        </div>

        {/* Invoices + Proposals */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Invoices ({(invoices ?? []).length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(invoices ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices</p>
              ) : (
                (invoices ?? []).slice(0, 5).map((inv) => (
                  <Link key={inv.id} href={`/invoices/${inv.id}`}>
                    <div className="flex items-center justify-between rounded-md p-2 hover:bg-accent text-sm">
                      <span className="font-medium">#{inv.invoice_number}</span>
                      <div className="flex items-center gap-2">
                        <InvoiceStatusBadge status={inv.status} />
                        <span className="tabular-nums">{formatCurrency(inv.amount)}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Proposals ({(proposals ?? []).length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(proposals ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No proposals</p>
              ) : (
                (proposals ?? []).slice(0, 5).map((p) => (
                  <Link key={p.id} href={`/proposals/${p.id}`}>
                    <div className="flex items-center justify-between rounded-md p-2 hover:bg-accent text-sm">
                      <span className="font-medium truncate">{p.title}</span>
                      <div className="flex items-center gap-2">
                        <ProposalStatusBadge status={p.status} />
                        <span className="tabular-nums">{formatCurrency(p.amount)}</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Danger zone */}
      <div>
        <h3 className="text-sm font-medium text-destructive mb-2">Danger zone</h3>
        <form
          action={async () => {
            'use server'
            await deleteClientAction(id)
          }}
        >
          <Button variant="destructive" size="sm" type="submit">
            Delete client
          </Button>
        </form>
      </div>
    </div>
  )
}
