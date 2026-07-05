import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getUser } from '@/lib/supabase/server'
import { buildGoogleAuthUrl, gmailOauthConfigured } from '@/lib/gmail/oauth'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  if (!gmailOauthConfigured()) {
    return NextResponse.redirect(new URL('/settings?gmail=not_configured', request.url))
  }

  // Same-origin redirect URI keeps localhost and production working with one
  // code path; both URIs must be registered in the Google Cloud console.
  const origin = new URL(request.url).origin
  const redirectUri = `${origin}/api/gmail/callback`
  const state = randomBytes(16).toString('hex')

  const response = NextResponse.redirect(buildGoogleAuthUrl(redirectUri, state))
  response.cookies.set('gmail_oauth_state', state, {
    httpOnly: true,
    secure: origin.startsWith('https'),
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  return response
}
