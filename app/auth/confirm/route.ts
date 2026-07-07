import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Landing point for the "Confirm your account" email link.
//
// Two link styles can arrive here:
//  - our custom email template sends token_hash/type, verified locally via
//    verifyOtp (preferred — the click logs the user straight in), or
//  - Supabase's default template verifies on their server first and redirects
//    back with a one-time ?code= to exchange for a session.
// Either way the click must land on a real session, never a raw error page.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  // /dashboard bounces to /onboarding on its own if the org isn't set up yet
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) redirect(next)
    redirect('/login?error=confirmation_failed')
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) redirect(next)
    // Supabase only issues a code after IT verified the email — the exchange
    // fails on a different device (missing PKCE cookie), but the address IS
    // confirmed, so send them to sign in rather than a scary error.
    redirect('/login?notice=email_confirmed')
  }

  // No recognizable params (crawler, truncated link) — just go sign in.
  redirect('/login')
}
