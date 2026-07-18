import { requireOrgOrRedirect } from '@/lib/supabase/guards'
import { createRecurringScheduleAction } from '@/lib/actions/recurring'
import { RecurringForm } from '@/components/invoices/recurring-form'

export const metadata = { title: 'New Recurring Payment' }

export default async function NewRecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>
}) {
  const { client: defaultClientId } = await searchParams
  const { supabase, org } = await requireOrgOrRedirect('/login')

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', org.id)
    .order('company_name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New recurring payment</h1>
        <p className="text-muted-foreground text-sm mt-1">
          A retainer or payment plan that bills itself on schedule
        </p>
      </div>
      <RecurringForm
        clients={clients ?? []}
        action={createRecurringScheduleAction}
        title="Schedule details"
        defaultClientId={defaultClientId}
      />
    </div>
  )
}
