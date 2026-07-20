'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, getOrganization, getUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/send'
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

  // Email the invitee. Best-effort: the invitation row already exists and the
  // sign-up-with-this-email path works without the email, so a send failure
  // downgrades the UI message (emailed: false) instead of failing the invite.
  let emailed = false
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    // Collapse whitespace: full_name is user-controlled and goes in the subject.
    const inviterName = (profile?.full_name ?? user.email ?? 'A teammate')
      .replace(/\s+/g, ' ')
      .trim()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://duebird.io'

    await sendEmail({
      to: email,
      subject: `${inviterName} invited you to join ${org.name} on Duebird`,
      body: `${inviterName} has invited you to join ${org.name} on Duebird — the shared workspace their team uses to track invoices, proposals, and follow-ups.

To accept the invitation:

1. Sign in at ${appUrl}/login — or create an account at ${appUrl}/signup if you don't have one yet.
2. Use this exact email address: ${email}
3. You'll be offered to join ${org.name} automatically.

If you weren't expecting this, you can safely ignore this email.`,
      replyTo: user.email ?? undefined,
    })
    emailed = true
  } catch (e) {
    console.error('invite email failed:', e instanceof Error ? e.message : e)
  }

  revalidatePath('/settings')
  return { success: true, emailed }
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

export async function removeTeamMember(memberId: string): Promise<ActionState> {
  const [user, org] = await Promise.all([getUser(), getOrganization()])
  if (!user || !org) redirect('/login')

  if (org.owner_id !== user.id) {
    return { error: 'Only the workspace owner can remove teammates' }
  }
  if (memberId === org.owner_id) {
    return { error: 'The workspace owner cannot be removed' }
  }

  // RLS lets the owner read teammates but not update their profiles, so the
  // membership change goes through the service-role client after the
  // owner/target checks above.
  try {
    const admin = createAdminClient()

    const { data: member, error: memberError } = await admin
      .from('profiles')
      .select('id, email')
      .eq('id', memberId)
      .eq('organization_id', org.id)
      .maybeSingle()
    if (memberError) return { error: memberError.message }
    if (!member) {
      return { error: 'That person is not a member of this workspace' }
    }

    // Delete their accepted invitation first: the tenant-guard trigger treats
    // it as standing authorization to point profiles.organization_id at this
    // org (a removed member could rejoin themselves), and its
    // UNIQUE(org, email) row would block inviting them again later.
    const { error: inviteError } = await admin
      .from('invitations')
      .delete()
      .eq('organization_id', org.id)
      .eq('email', member.email.toLowerCase())
    if (inviteError) return { error: inviteError.message }

    const { error: profileError } = await admin
      .from('profiles')
      .update({ organization_id: null })
      .eq('id', memberId)
      .eq('organization_id', org.id)
    if (profileError) return { error: profileError.message }
  } catch {
    return { error: 'Could not remove this member. Please try again.' }
  }

  revalidatePath('/settings')
  return { success: true }
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
