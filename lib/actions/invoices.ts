'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { logActivity } from './activities'
import { computeInvoicePriority } from '@/lib/follow-up-engine/engine'
import type { ActionState, InvoiceStatus, Priority } from '@/types/database'

/** The priority <select> submits "auto" or an explicit level; "auto" defers
 *  to computeInvoicePriority and clears the manual override. */
function parsePriority(formData: FormData, dueDate: string, status: InvoiceStatus): { priority: Priority; priority_manual: boolean } {
  const raw = formData.get('priority') as string | null
  if (raw && raw !== 'auto') {
    return { priority: raw as Priority, priority_manual: true }
  }
  return { priority: computeInvoicePriority(dueDate, status), priority_manual: false }
}

export async function createInvoiceAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  const dueDate = formData.get('due_date') as string
  const status = (formData.get('status') as InvoiceStatus) || 'draft'

  const data = {
    organization_id: org.id,
    client_id: formData.get('client_id') as string,
    invoice_number: formData.get('invoice_number') as string,
    title: (formData.get('title') as string) || null,
    amount: parseFloat(formData.get('amount') as string) || 0,
    amount_paid: parseFloat(formData.get('amount_paid') as string) || 0,
    currency: (formData.get('currency') as string) || 'USD',
    issue_date: formData.get('issue_date') as string,
    due_date: dueDate,
    status,
    ...parsePriority(formData, dueDate, status),
    payment_link: (formData.get('payment_link') as string) || null,
    notes: (formData.get('notes') as string) || null,
  }

  if (!data.client_id || !data.invoice_number || !data.due_date) {
    return { error: 'Client, invoice number, and due date are required' }
  }

  const { data: invoice, error } = await supabase.from('invoices').insert(data).select().single()
  if (error) return { error: error.message }

  await logActivity({
    orgId: org.id,
    type: 'invoice_created',
    entityType: 'invoice',
    entityId: invoice.id,
    description: `Created invoice ${invoice.invoice_number} for ${invoice.amount} ${invoice.currency}`,
    metadata: { amount: invoice.amount, currency: invoice.currency },
  })

  revalidatePath('/invoices')
  redirect('/invoices')
}

export async function updateInvoiceAction(id: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  const dueDate = formData.get('due_date') as string
  const newStatus = (formData.get('status') as InvoiceStatus) || 'draft'

  const data = {
    invoice_number: formData.get('invoice_number') as string,
    title: (formData.get('title') as string) || null,
    amount: parseFloat(formData.get('amount') as string) || 0,
    amount_paid: parseFloat(formData.get('amount_paid') as string) || 0,
    currency: (formData.get('currency') as string) || 'USD',
    issue_date: formData.get('issue_date') as string,
    due_date: dueDate,
    status: newStatus,
    ...parsePriority(formData, dueDate, newStatus),
    payment_link: (formData.get('payment_link') as string) || null,
    notes: (formData.get('notes') as string) || null,
  }

  const { error } = await supabase
    .from('invoices')
    .update(data)
    .eq('id', id)
    .eq('organization_id', org.id)

  if (error) return { error: error.message }

  const activityType = newStatus === 'paid' ? 'invoice_paid' : 'invoice_updated'
  await logActivity({
    orgId: org.id,
    type: activityType,
    entityType: 'invoice',
    entityId: id,
    description: `Invoice ${data.invoice_number} updated → ${newStatus}`,
  })

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${id}`)
  redirect(`/invoices/${id}`)
}

export async function markInvoicePaidAction(id: string) {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) return { error: 'Not authenticated' }

  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('invoice_number, amount')
    .eq('id', id)
    .eq('organization_id', org.id)
    .single()

  if (fetchError || !invoice) return { error: 'Invoice not found' }

  const { error } = await supabase
    .from('invoices')
    .update({ status: 'paid', amount_paid: invoice.amount, priority: 'low', priority_manual: false })
    .eq('id', id)
    .eq('organization_id', org.id)

  if (error) return { error: error.message }

  await logActivity({
    orgId: org.id,
    type: 'invoice_paid',
    entityType: 'invoice',
    entityId: id,
    description: `Invoice ${invoice.invoice_number} marked as paid`,
    metadata: { amount: invoice.amount },
  })

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${id}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteInvoiceAction(id: string) {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  await supabase.from('invoices').delete().eq('id', id).eq('organization_id', org.id)

  revalidatePath('/invoices')
  redirect('/invoices')
}
