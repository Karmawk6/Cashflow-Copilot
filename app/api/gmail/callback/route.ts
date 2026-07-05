import { NextRequest, NextResponse } from 'next/server'
import { createClient, getOrganization, getUser } from '@/lib/supabase/server'
import { exchangeCodeForTokens, fetchGoogleEmail } from '@/lib/gmail/oauth'

function settingsRedirect(request: NextRequest, param: string) {
  const response = NextResponse.redirect(new URL(`/settings?gmail=${param}`, request.url))
  response.cookies.delete('gmail_oauth_state')
  return response
}

export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const org = await getOrganization()
  if (!org) return settingsRedirect(request, 'error')

  const params = request.nextUrl.searchParams
  const code = params.get('code')
  const state = params.get('state')
  const expectedState = request.cookies.get('gmail_oauth_state')?.value

  // User clicked "cancel" on Google's consent screen, or CSRF state mismatch
  if (params.get('error') || !code) return settingsRedirect(request, 'cancelled')
  if (!state || !expectedState || state !== expectedState) {
    return settingsRedirect(request, 'error')
  }

  try {
    const origin = new URL(request.url).origin
    const tokens = await exchangeCodeForTokens(code, `${origin}/api/gmail/callback`)

    if (!tokens.refresh_token) {
      // Google only returns a refresh token with prompt=consent; if it is
      // missing something is off — do not store a connection that will die.
      return settingsRedirect(request, 'error')
    }

    const gmailAddress = await fetchGoogleEmail(tokens.access_token)

    const supabase = await createClient()
    const { error } = await supabase.from('gmail_connections').upsert(
      {
        user_id: user.id,
        organization_id: org.id,
        gmail_address: gmailAddress,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        status: 'active',
      },
      { onConflict: 'user_id' }
    )

    if (error) return settingsRedirect(request, 'error')
    return settingsRedirect(request, 'connected')
  } catch (err) {
    console.error('Gmail OAuth callback failed:', err)
    return settingsRedirect(request, 'error')
  }
}
