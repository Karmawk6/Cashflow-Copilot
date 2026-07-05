import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, RecurringSchedule } from '@/types/database'
import { computeInvoicePriority, scheduleAfterGeneration, scheduleShouldGenerate } from './engine'

// Safety valve: a schedule that somehow accumulated years of missed periods
// should not carpet-bomb the client with invoices in one run.
const MAX_CATCHUP_PER_RUN = 24

function formatPeriod(dateOnly: string): string {
  const [y, m] = dateOnly.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Generate every invoice a schedule is due for (usually one; more if periods
 * were missed), advancing the schedule as it goes. Works with either an
 * org-scoped client (server action) or a service-role client (cron).
 * Returns the number of invoices created.
 */
export async function generateDueInvoices(
  supabase: SupabaseClient<Database>,
  schedule: RecurringSchedule
): Promise<{ generated: number; error?: string }> {
  let current = { ...schedule }
  let generated = 0
  const today = new Date().toISOString().split('T')[0]

  while (scheduleShouldGenerate(current) && generated < MAX_CATCHUP_PER_RUN) {
    const installmentNumber = current.installments_generated + 1
    const invoiceTitle =
      current.kind === 'payment_plan'
        ? `${current.title} — payment ${installmentNumber} of ${current.total_installments}`
        : `${current.title} — ${formatPeriod(current.next_due_date)}`

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        organization_id: current.organization_id,
        client_id: current.client_id,
        recurring_schedule_id: current.id,
        invoice_number: `REC-${current.id.slice(0, 4).toUpperCase()}-${installmentNumber}`,
        title: invoiceTitle,
        amount: current.amount,
        amount_paid: 0,
        currency: current.currency,
        issue_date: today,
        due_date: current.next_due_date,
        status: 'sent',
        priority: computeInvoicePriority(current.next_due_date, 'sent'),
        payment_link: current.payment_link,
      })
      .select('id')
      .single()

    if (invoiceError || !invoice) {
      return { generated, error: invoiceError?.message ?? 'Invoice insert failed' }
    }

    // Courtesy heads-up before the due date — only when the due date is still
    // ahead; catch-up invoices for past periods go straight to overdue handling.
    if (current.remind_days_before > 0 && current.next_due_date >= today) {
      await supabase.from('follow_up_events').insert({
        organization_id: current.organization_id,
        client_id: current.client_id,
        invoice_id: invoice.id,
        type: 'payment_upcoming',
        status: 'pending',
        priority: 'low',
        due_date: new Date().toISOString(),
      })
    }

    const after = scheduleAfterGeneration(current)
    const { error: updateError } = await supabase
      .from('recurring_schedules')
      .update(after)
      .eq('id', current.id)

    if (updateError) return { generated: generated + 1, error: updateError.message }

    current = { ...current, ...after }
    generated++
  }

  return { generated }
}
