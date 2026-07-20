import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Tests run against the LIVE shared Supabase DB (repo convention — see
// AGENTS.md). Writes are confined to landing_leads rows on the
// @duebird-e2e.invalid domain and cleaned up after each run.
export const E2E_LEAD_DOMAIN = 'duebird-e2e.invalid'

function loadEnvLocal(): Record<string, string> {
  const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
  const env: Record<string, string> = {}
  for (const line of raw.split('\n')) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[match[1]] = value
  }
  return env
}

export function createE2eAdminClient() {
  const env = loadEnvLocal()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing from .env.local'
    )
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  })
}

export async function deleteE2eLeads() {
  const admin = createE2eAdminClient()
  const { error } = await admin
    .from('landing_leads')
    .delete()
    .like('email', `%@${E2E_LEAD_DOMAIN}`)
  if (error) throw new Error(`e2e lead cleanup failed: ${error.message}`)
}
