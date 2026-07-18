import { redirect } from 'next/navigation'
import { createClient, getOrganization } from './server'

/** Request-scoped Supabase client + the caller's org (null when not onboarded). */
export async function getOrgContext() {
  const supabase = await createClient()
  const org = await getOrganization()
  return { supabase, org }
}

/** Pages send org-less users to /onboarding (signed in but not set up);
 *  server actions send them to /login (stale session). */
export async function requireOrgOrRedirect(target: '/onboarding' | '/login') {
  const { supabase, org } = await getOrgContext()
  if (!org) redirect(target)
  return { supabase, org }
}
