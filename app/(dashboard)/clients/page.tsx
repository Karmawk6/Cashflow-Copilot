import Link from 'next/link'
import { requireOrgOrRedirect } from '@/lib/supabase/guards'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ClientStatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Users, Mail } from 'lucide-react'

export const metadata = { title: 'Clients' }

export default async function ClientsPage() {
  const { supabase, org } = await requireOrgOrRedirect('/onboarding')

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', org.id)
    .order('company_name', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">{clients?.length ?? 0} total clients</p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            Add client
          </Link>
        </Button>
      </div>

      {!clients || clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start tracking proposals and invoices."
          action={{ label: 'Add client', href: '/clients/new' }}
        />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {client.company_name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium">{client.company_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{client.contact_name ?? '—'}</TableCell>
                  <TableCell>
                    {client.email ? (
                      <a href={`mailto:${client.email}`} className="text-primary hover:underline flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ClientStatusBadge status={client.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {client.last_contact_date ? formatDate(client.last_contact_date) : '—'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/clients/${client.id}`}>View</Link>
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
