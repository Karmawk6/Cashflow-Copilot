import { cache } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { syncOrgWorkState } from '@/lib/follow-up-engine/sync'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies can't be mutated here;
            // the proxy handles token refreshes.
          }
        },
      },
    }
  )
}

// cache() dedupes these per request — layout, header, and page all call them,
// which previously meant 3-6 Supabase round trips per page view.
export const getUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

export const getOrganization = cache(async () => {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return null

  // Resolve by membership (profiles.organization_id), not ownership —
  // invited teammates belong to an org they don't own.
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return null

  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.organization_id)
    .single()

  if (!data) return null

  // Live overdue/priority correction — every page load, not just the daily
  // cron — so nothing sits showing yesterday's status until 8am UTC.
  await syncOrgWorkState(supabase, data.id)

  return data
})
