import { notFound, redirect } from 'next/navigation'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { updateRecurringScheduleAction } from '@/lib/actions/recurring'
import { RecurringForm } from '@/components/invoices/recurring-form'
import type { RecurringSchedule } from '@/types/database'

export const metadata = { title: 'Edit Recurring Payment' }

export default async function EditRecurringPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  const [{ data: schedule }, { data: clients }] = await Promise.all([
    supabase
      .from('recurring_schedules')
      .select('*')
      .eq('id', id)
      .eq('organization_id', org.id)
      .single(),
    supabase
      .from('clients')
      .select('*')
      .eq('organization_id', org.id)
      .order('company_name'),
  ])

  if (!schedule) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit recurring payment</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Changes apply to future invoices — already-generated ones are untouched
        </p>
      </div>
      <RecurringForm
        schedule={schedule as RecurringSchedule}
        clients={clients ?? []}
        action={updateRecurringScheduleAction.bind(null, id)}
        title="Schedule details"
      />
    </div>
  )
}
