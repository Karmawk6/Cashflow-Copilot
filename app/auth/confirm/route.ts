import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Landing point for the "Confirm your account" and "Reset password" email links.
//
// Two link styles can arrive here:
//  - our custom email templates send token_hash/type, verified locally via
//    verifyOtp (preferred — the click logs the user straight in), or
//  - Supabase's default templates verify on their server first and redirect
//    back with a one-time ?code= to exchange for a session.
// Either way the click must land on a real session, never a raw error page.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  // /dashboard bounces to /onboarding on its own if the org isn't set up yet.
  // Same-origin paths only — '//' is protocol-relative, i.e. an open redirect.
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'

  const supabase = await createClient()

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    // A recovery click must land on the set-new-password form, never the app.
    if (!error) redirect(type === 'recovery' ? '/reset-password' : next)
    if (type === 'recovery') redirect('/forgot-password?error=recovery_failed')
    redirect('/login?error=confirmation_failed')
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) redirect(next)
    // A failed recovery exchange must not claim "email confirmed" — the user
    // needs a fresh reset link, not a sign-in prompt.
    if (next === '/reset-password') redirect('/forgot-password?error=recovery_failed')
    // Supabase only issues a code after IT verified the email — the exchange
    // fails on a different device (missing PKCE cookie), but the address IS
    // confirmed, so send them to sign in rather than a scary error.
    redirect('/login?notice=email_confirmed')
  }

  // No recognizable params (crawler, truncated link) — just go sign in.
  redirect('/login')
}
