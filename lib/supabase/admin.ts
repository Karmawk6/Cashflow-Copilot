import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Service-role client: bypasses RLS entirely. Server-only — importing this
// from a client component would leak the key. Needed where no user session
// exists yet (e.g. the signup allowlist check runs pre-auth, so the anon key
// sees nothing through RLS).
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false } }
  )
}
