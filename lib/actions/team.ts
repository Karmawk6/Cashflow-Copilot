'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getOrganization, getUser } from '@/lib/supabase/server'
import type { ActionState } from '@/types/database'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export async function inviteTeammate(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const [user, org] = await Promise.all([getUser(), getOrganization()])
  if (!user || !org) redirect('/login')

  if (org.owner_id !== user.id) {
    return { error: 'Only the workspace owner can invite teammates' }
  }

  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return { error: 'Enter a valid email address' }
  }
  if (email === user.email?.toLowerCase()) {
    return { error: 'That is your own email address' }
  }

  const { error } = await supabase.from('invitations').insert({
    organization_id: org.id,
    email,
    role: 'member',
    invited_by: user.id,
  })

  if (error) {
    return {
      error: error.code === '23505'
        ? 'That email is already invited or already a member'
        : error.message,
    }
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function revokeInvitation(invitationId: string) {
  const supabase = await createClient()
  const [user, org] = await Promise.all([getUser(), getOrganization()])
  if (!user || !org) redirect('/login')

  // RLS also enforces owner-only; the eq() keeps the delete org-scoped.
  await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)
    .eq('organization_id', org.id)

  revalidatePath('/settings')
}

export async function acceptInvitation(invitationId: string) {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.rpc('accept_invitation', { invitation_id: invitationId })
  if (error) {
    redirect('/onboarding?invite_error=1')
  }

  redirect('/dashboard')
}
