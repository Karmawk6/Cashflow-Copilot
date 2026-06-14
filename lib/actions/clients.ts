'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { logActivity } from './activities'
import type { ActionState, ClientStatus } from '@/types/database'

export async function createClientAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  const data = {
    organization_id: org.id,
    company_name: formData.get('company_name') as string,
    contact_name: (formData.get('contact_name') as string) || null,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    website: (formData.get('website') as string) || null,
    status: ((formData.get('status') as ClientStatus) || 'active'),
    notes: (formData.get('notes') as string) || null,
  }

  if (!data.company_name) return { error: 'Company name is required' }

  const { data: client, error } = await supabase.from('clients').insert(data).select().single()
  if (error) return { error: error.message }

  await logActivity({
    orgId: org.id,
    type: 'client_created',
    entityType: 'client',
    entityId: client.id,
    description: `Created client: ${client.company_name}`,
  })

  revalidatePath('/clients')
  redirect('/clients')
}

export async function updateClientAction(id: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  const data = {
    company_name: formData.get('company_name') as string,
    contact_name: (formData.get('contact_name') as string) || null,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    website: (formData.get('website') as string) || null,
    status: ((formData.get('status') as ClientStatus) || 'active'),
    notes: (formData.get('notes') as string) || null,
  }

  const { error } = await supabase
    .from('clients')
    .update(data)
    .eq('id', id)
    .eq('organization_id', org.id)

  if (error) return { error: error.message }

  await logActivity({
    orgId: org.id,
    type: 'client_updated',
    entityType: 'client',
    entityId: id,
    description: `Updated client: ${data.company_name}`,
  })

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  redirect(`/clients/${id}`)
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  await supabase.from('clients').delete().eq('id', id).eq('organization_id', org.id)

  revalidatePath('/clients')
  redirect('/clients')
}
