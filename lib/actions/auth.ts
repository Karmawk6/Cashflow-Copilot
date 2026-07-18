'use server'

import { redirect } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'
import { z } from 'zod'
import type { ActionState } from '@/types/database'

const INVITE_ONLY_MESSAGE =
  'Duebird is invite-only right now. Book a call at duebird.io to get access — or, if your team already uses Duebird, ask your workspace owner to invite you with this email.'

// Signup is allowed for emails the owner has approved (client paid their
// invoice) OR emails with a pending teammate invitation. Runs pre-auth, so it
// needs the service-role client — RLS hides both tables from the anon key.
// Both tables store emails lowercased/trimmed (DB trigger / inviteTeammate).
async function isEmailAllowedToSignUp(email: string): Promise<boolean> {
  const admin = createAdminClient()
  const normalized = email.trim().toLowerCase()
  const [approved, invited] = await Promise.all([
    admin
      .from('approved_emails')
      .select('email')
      .eq('email', normalized)
      .maybeSingle(),
    admin
      .from('invitations')
      .select('id')
      .eq('status', 'pending')
      .eq('email', normalized)
      .limit(1)
      .maybeSingle(),
  ])
  if (approved.error || invited.error) {
    throw approved.error ?? invited.error
  }
  return Boolean(approved.data || invited.data)
}

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function signup(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    fullName: formData.get('fullName') as string,
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Gate BEFORE auth.signUp: a rejected email never creates an auth user and
  // never receives a confirmation email. Fail closed on any lookup error.
  try {
    if (!(await isEmailAllowedToSignUp(parsed.data.email))) {
      return { error: INVITE_ONLY_MESSAGE }
    }
  } catch {
    return { error: 'Something went wrong — please try again in a moment.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      // Where the confirmation email lands. Our template links here directly;
      // with Supabase's default template this becomes the post-verify redirect.
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Supabase's enumeration protection makes signUp "succeed" for an email
  // that already has a confirmed account — but the returned user has no
  // identities. Surface that as "sign in instead" rather than the misleading
  // "confirmation email sent" notice.
  if (data.user && data.user.identities?.length === 0) {
    return {
      error:
        'An account with this email already exists. Please sign in instead.',
    }
  }

  // No session means "Confirm email" is required: the user can't onboard yet,
  // so say so instead of dropping them into a form that would silently fail.
  if (!data.session) {
    redirect('/login?notice=confirm_email_sent')
  }

  redirect('/onboarding')
}

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function completeOnboarding(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) redirect('/login')

  const orgName = formData.get('orgName') as string
  const businessType = formData.get('businessType') as 'consulting' | 'agency' | 'freelance' | 'cdfi'
  const fullName = formData.get('fullName') as string

  if (!orgName || orgName.length < 2) {
    return { error: 'Organization name must be at least 2 characters' }
  }

  // Creating a workspace is the paid thing — allowlist only, deliberately NOT
  // invitations: invited teammates join an existing org via the Join card
  // above this form, they don't get to create their own.
  try {
    const admin = createAdminClient()
    const { data: approved, error: approvedError } = await admin
      .from('approved_emails')
      .select('email')
      .eq('email', user.email!.trim().toLowerCase())
      .maybeSingle()
    if (approvedError) throw approvedError
    if (!approved) {
      return {
        error:
          'Creating a new workspace requires approval — book a call at duebird.io. If you were invited to join a team, use the Join button above instead.',
      }
    }
  } catch {
    return { error: 'Something went wrong — please try again in a moment.' }
  }

  const slug = slugify(orgName) + '-' + Math.random().toString(36).slice(2, 6)

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: orgName,
      slug,
      owner_id: user.id,
      business_type: businessType || 'consulting',
    })
    .select()
    .single()

  if (orgError) {
    return { error: orgError.message }
  }

  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email!,
    full_name: fullName || user.user_metadata?.full_name || null,
    organization_id: org.id,
    onboarded: true,
  })

  await supabase.from('follow_up_rules').insert([
    { organization_id: org.id, type: 'proposal' as const, days_until_followup: 3, days_until_escalate: 7, days_until_critical: 14 },
    { organization_id: org.id, type: 'invoice' as const, days_until_followup: 1, days_until_escalate: 8, days_until_critical: 22 },
    { organization_id: org.id, type: 'ghosted_lead' as const, days_until_followup: 5, days_until_escalate: 10, days_until_critical: 21 },
  ])

  redirect('/dashboard')
}
