'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { logActivity } from './activities'
import { advanceDueDate } from '@/lib/follow-up-engine/engine'
import { generateDueInvoices } from '@/lib/follow-up-engine/recurring'
import type { ActionState, RecurringFrequency, RecurringKind, RecurringSchedule } from '@/types/database'

function parseScheduleForm(formData: FormData) {
  const kind = (formData.get('kind') as RecurringKind) || 'retainer'
  const nextDueDate = formData.get('next_due_date') as string
  const totalRaw = formData.get('total_installments') as string

  return {
    client_id: formData.get('client_id') as string,
    title: (formData.get('title') as string)?.trim(),
    kind,
    amount: parseFloat(formData.get('amount') as string) || 0,
    currency: (formData.get('currency') as string) || 'USD',
    frequency: (formData.get('frequency') as RecurringFrequency) || 'monthly',
    next_due_date: nextDueDate,
    anchor_day: nextDueDate ? Number(nextDueDate.split('-')[2]) : 1,
    end_date: (formData.get('end_date') as string) || null,
    total_installments: kind === 'payment_plan' ? parseInt(totalRaw, 10) || null : null,
    remind_days_before: Math.min(30, Math.max(0, parseInt(formData.get('remind_days_before') as string, 10) || 0)),
    payment_link: (formData.get('payment_link') as string) || null,
    notes: (formData.get('notes') as string) || null,
  }
}

export async function createRecurringScheduleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  const data = parseScheduleForm(formData)

  if (!data.client_id || !data.title || !data.next_due_date || data.amount <= 0) {
    return { error: 'Client, title, amount, and first due date are required' }
  }
  if (data.kind === 'payment_plan' && !data.total_installments) {
    return { error: 'Payment plans need the number of installments' }
  }

  const { data: schedule, error } = await supabase
    .from('recurring_schedules')
    .insert({ ...data, organization_id: org.id, status: 'active' })
    .select()
    .single()

  if (error) return { error: error.message }

  await logActivity({
    orgId: org.id,
    type: 'schedule_created',
    entityType: 'recurring_schedule',
    entityId: schedule.id,
    description: `Created recurring ${data.kind === 'payment_plan' ? 'payment plan' : 'retainer'} "${data.title}" — ${data.amount} ${data.currency} ${data.frequency}`,
    metadata: { amount: data.amount, frequency: data.frequency },
  })

  // If the first due date is already inside the reminder window (or in the
  // past), bill it right away instead of waiting for tomorrow's cron.
  await generateDueInvoices(supabase, schedule as RecurringSchedule)

  revalidatePath('/invoices')
  redirect('/invoices?tab=recurring')
}

export async function updateRecurringScheduleAction(id: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  const data = parseScheduleForm(formData)

  if (!data.client_id || !data.title || !data.next_due_date || data.amount <= 0) {
    return { error: 'Client, title, amount, and next due date are required' }
  }
  if (data.kind === 'payment_plan' && !data.total_installments) {
    return { error: 'Payment plans need the number of installments' }
  }

  const { error } = await supabase
    .from('recurring_schedules')
    .update(data)
    .eq('id', id)
    .eq('organization_id', org.id)

  if (error) return { error: error.message }

  await logActivity({
    orgId: org.id,
    type: 'schedule_updated',
    entityType: 'recurring_schedule',
    entityId: id,
    description: `Updated recurring schedule "${data.title}"`,
  })

  // Deliberately no generateDueInvoices() here: editing a schedule (e.g.
  // pulling next_due_date closer) must persist exactly what the user set.
  // Billing/advancement happens on its own via the daily cron, same as any
  // other schedule reaching its due date.

  revalidatePath('/invoices')
  redirect('/invoices?tab=recurring')
}

export async function pauseScheduleAction(id: string) {
  return setScheduleStatus(id, 'paused', 'Paused recurring schedule')
}

export async function cancelScheduleAction(id: string) {
  return setScheduleStatus(id, 'cancelled', 'Cancelled recurring schedule')
}

/**
 * Resume skips periods missed while paused (no surprise back-billing): the
 * next due date is rolled forward to the first one that is today or later.
 */
export async function resumeScheduleAction(id: string) {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) return { error: 'Not authenticated' }

  const { data: schedule } = await supabase
    .from('recurring_schedules')
    .select('*')
    .eq('id', id)
    .eq('organization_id', org.id)
    .single()

  if (!schedule) return { error: 'Schedule not found' }

  const today = new Date().toISOString().split('T')[0]
  let nextDue = schedule.next_due_date
  while (nextDue < today) {
    nextDue = advanceDueDate(nextDue, schedule.frequency, schedule.anchor_day)
  }

  const { error } = await supabase
    .from('recurring_schedules')
    .update({ status: 'active', next_due_date: nextDue })
    .eq('id', id)
    .eq('organization_id', org.id)

  if (error) return { error: error.message }

  await logActivity({
    orgId: org.id,
    type: 'schedule_updated',
    entityType: 'recurring_schedule',
    entityId: id,
    description: `Resumed recurring schedule "${schedule.title}" — next payment ${nextDue}`,
  })

  revalidatePath('/invoices')
  return { success: true }
}

async function setScheduleStatus(id: string, status: 'paused' | 'cancelled', description: string) {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('recurring_schedules')
    .update({ status })
    .eq('id', id)
    .eq('organization_id', org.id)

  if (error) return { error: error.message }

  await logActivity({
    orgId: org.id,
    type: 'schedule_updated',
    entityType: 'recurring_schedule',
    entityId: id,
    description,
  })

  revalidatePath('/invoices')
  return { success: true }
}
