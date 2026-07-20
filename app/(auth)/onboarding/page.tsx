import { redirect } from 'next/navigation'
import { createClient, getUser } from '@/lib/supabase/server'
import { OnboardingForm } from '@/components/auth/onboarding-form'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ invite_error?: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: invitations } = await supabase.rpc('my_pending_invitations')
  const { invite_error } = await searchParams

  return (
    <OnboardingForm
      invitations={invitations ?? []}
      inviteError={invite_error === '1'}
      userEmail={user.email ?? ''}
    />
  )
}
