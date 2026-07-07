import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Landing point for the "Confirm your account" email link. Supabase's
// hosted verify endpoint checks the token, then sends the browser here with
// token_hash/type so we can exchange it for a real session server-side
// (the legacy default template hits Supabase's own /verify directly and
// never gives this app a session cookie — this route is what's missing).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  // /dashboard bounces to /onboarding on its own if the org isn't set up yet
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      redirect(next)
    }
  }

  redirect('/login?error=confirmation_failed')
}
