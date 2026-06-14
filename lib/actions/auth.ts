'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { ActionState } from '@/types/database'

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

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
    },
  })

  if (error) {
    return { error: error.message }
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const orgName = formData.get('orgName') as string
  const businessType = formData.get('businessType') as 'consulting' | 'agency' | 'freelance'
  const fullName = formData.get('fullName') as string

  if (!orgName || orgName.length < 2) {
    return { error: 'Organization name must be at least 2 characters' }
  }

  const slug = orgName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    + '-' + Math.random().toString(36).slice(2, 6)

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
