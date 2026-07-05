import { redirect } from 'next/navigation'
import { createClient, getOrganization, getUser } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsForm } from '@/components/settings/settings-form'
import { TeamSection } from '@/components/settings/team-section'
import { CsvImport } from '@/components/shared/csv-import'
import { DemoSeedButton } from '@/components/shared/demo-seed-button'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const [user, org] = await Promise.all([getUser(), getOrganization()])
  if (!user) redirect('/login')

  const isOwner = org ? org.owner_id === user.id : false

  const [{ data: profile }, { data: followUpRules }, { data: members }, { data: invitations }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      org
        ? supabase.from('follow_up_rules').select('*').eq('organization_id', org.id)
        : Promise.resolve({ data: [] }),
      org
        ? supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('organization_id', org.id)
            .order('created_at')
        : Promise.resolve({ data: [] }),
      org && isOwner
        ? supabase
            .from('invitations')
            .select('*')
            .eq('organization_id', org.id)
            .eq('status', 'pending')
            .order('created_at')
        : Promise.resolve({ data: [] }),
    ])

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and workspace settings</p>
      </div>

      <SettingsForm
        user={user}
        profile={profile}
        org={org}
        followUpRules={followUpRules ?? []}
      />
      {org && (
        <TeamSection
          members={members ?? []}
          invitations={invitations ?? []}
          ownerId={org.owner_id}
          isOwner={isOwner}
          appUrl={process.env.NEXT_PUBLIC_APP_URL ?? 'https://cashflow-copilot-six.vercel.app'}
        />
      )}
      <CsvImport />
      <DemoSeedButton />
    </div>
  )
}
