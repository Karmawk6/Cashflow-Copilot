'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email/send'
import { CONTACT_EMAIL } from '@/app/(legal)/legal-info'
import type { ActionState } from '@/types/database'

const leadSchema = z.object({
  email: z
    .string()
    .max(254, 'Please enter a valid email address.')
    .email('Please enter a valid email address.'),
})

// Public (pre-auth) action: the landing page is the only caller. Inserts use
// the service-role client because landing_leads has RLS with no policies —
// the anon key can neither write nor enumerate it.
export async function submitLandingLead(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Honeypot: real visitors never see this field; a filled value means a bot.
  // Report success so the bot moves on without learning it was dropped.
  if (formData.get('website')) {
    return { success: true }
  }

  const parsed = leadSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Best-effort per-IP throttle (x-forwarded-for is spoofable and the limiter
  // is per-instance); the UNIQUE constraint is the durable backstop.
  const ip =
    ((await headers()).get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    'unknown'
  const limit = rateLimit(`lead:${ip}`, 5, 10 * 60_000)
  if (!limit.ok) {
    return { error: 'Too many attempts — please try again in a few minutes.' }
  }

  const email = parsed.data.email.trim().toLowerCase()
  const admin = createAdminClient()
  const { error } = await admin
    .from('landing_leads')
    .insert({ email, source: 'landing-cta' })

  if (error) {
    // Duplicate email: same success state as a fresh signup, per spec — the
    // visitor shouldn't learn whether an address is already on the list.
    if (error.code === '23505') {
      return { success: true }
    }
    return { error: 'Something went wrong — please try again.' }
  }

  // Founder notification is best-effort: the lead is already saved, so a
  // Resend hiccup must not surface as a failure to the visitor.
  try {
    await sendEmail({
      to: CONTACT_EMAIL,
      subject: `New Duebird lead: ${email}`,
      body: `A visitor left their email on the landing page.\n\nEmail: ${email}\nSource: landing-cta\nTime: ${new Date().toISOString()}`,
    })
  } catch (notifyError) {
    console.error('Lead saved but founder notification failed:', notifyError)
  }

  return { success: true }
}
