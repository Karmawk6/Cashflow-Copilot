import { redirect } from 'next/navigation'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { createInvoiceAction } from '@/lib/actions/invoices'
import { InvoiceForm } from '@/components/invoices/invoice-form'

export const metadata = { title: 'New Invoice' }

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>
}) {
  const { client: defaultClientId } = await searchParams
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', org.id)
    .order('company_name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New invoice</h1>
        <p className="text-muted-foreground text-sm mt-1">Create an invoice to track and follow up on</p>
      </div>
      <InvoiceForm
        clients={clients ?? []}
        action={createInvoiceAction}
        title="Invoice details"
        defaultClientId={defaultClientId}
      />
    </div>
  )
}
