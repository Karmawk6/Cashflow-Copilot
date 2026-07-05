import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, GmailConnection } from '@/types/database'
import { refreshAccessToken } from './oauth'

const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'

// RFC 2047 so subjects with non-ASCII characters survive transport
function encodeSubject(subject: string): string {
  return /^[\x20-\x7e]*$/.test(subject)
    ? subject
    : `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`
}

function buildRawMessage(from: string, to: string, subject: string, body: string): string {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeSubject(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    body,
  ].join('\r\n')
  return Buffer.from(message, 'utf-8').toString('base64url')
}

/** Access token valid for at least the next minute, refreshing (and persisting) if not. */
async function freshAccessToken(
  supabase: SupabaseClient<Database>,
  connection: GmailConnection
): Promise<string> {
  if (new Date(connection.token_expires_at).getTime() > Date.now() + 60_000) {
    return connection.access_token
  }
  const refreshed = await refreshAccessToken(connection.refresh_token)
  await supabase
    .from('gmail_connections')
    .update({
      access_token: refreshed.access_token,
      token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      status: 'active',
    })
    .eq('id', connection.id)
  return refreshed.access_token
}

/**
 * Send through the connected Gmail account. Throws on failure — the caller
 * decides whether to fall back to the platform sender. A failed refresh marks
 * the connection so Settings can prompt the user to reconnect.
 */
export async function sendViaGmail(
  supabase: SupabaseClient<Database>,
  connection: GmailConnection,
  { to, subject, body }: { to: string; subject: string; body: string }
): Promise<{ success: true; messageId?: string; via: 'gmail' }> {
  let accessToken: string
  try {
    accessToken = await freshAccessToken(supabase, connection)
  } catch (err) {
    await supabase.from('gmail_connections').update({ status: 'error' }).eq('id', connection.id)
    throw err
  }

  const res = await fetch(GMAIL_SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: buildRawMessage(connection.gmail_address, to, subject, body) }),
  })

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      await supabase.from('gmail_connections').update({ status: 'error' }).eq('id', connection.id)
    }
    throw new Error(`Gmail send failed (${res.status}): ${(await res.text()).slice(0, 200)}`)
  }

  const data = await res.json()
  return { success: true, messageId: data.id, via: 'gmail' }
}
