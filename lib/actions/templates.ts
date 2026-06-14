'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getOrganization } from '@/lib/supabase/server'
import type { ActionState, EmailTemplateType, EmailTone } from '@/types/database'

export async function createTemplateAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  const data = {
    organization_id: org.id,
    name: formData.get('name') as string,
    type: formData.get('type') as EmailTemplateType,
    tone: (formData.get('tone') as EmailTone) || 'professional',
    subject: formData.get('subject') as string,
    body: formData.get('body') as string,
    is_default: false,
  }

  if (!data.name || !data.subject || !data.body) {
    return { error: 'Name, subject, and body are required' }
  }

  await supabase.from('email_templates').insert(data)

  revalidatePath('/templates')
  redirect('/templates')
}

export async function updateTemplateAction(id: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  const data = {
    name: formData.get('name') as string,
    type: formData.get('type') as EmailTemplateType,
    tone: (formData.get('tone') as EmailTone) || 'professional',
    subject: formData.get('subject') as string,
    body: formData.get('body') as string,
  }

  await supabase
    .from('email_templates')
    .update(data)
    .eq('id', id)
    .eq('organization_id', org.id)

  revalidatePath('/templates')
  redirect('/templates')
}

export async function deleteTemplateAction(id: string) {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  await supabase
    .from('email_templates')
    .delete()
    .eq('id', id)
    .eq('organization_id', org.id)

  revalidatePath('/templates')
  redirect('/templates')
}
