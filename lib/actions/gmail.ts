'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser } from '@/lib/supabase/server'
import { revokeToken } from '@/lib/gmail/oauth'

export async function disconnectGmailAction() {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: connection } = await supabase
    .from('gmail_connections')
    .select('id, refresh_token')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!connection) return { error: 'No Gmail connection found' }

  await revokeToken(connection.refresh_token)

  const { error } = await supabase.from('gmail_connections').delete().eq('id', connection.id)
  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true }
}
