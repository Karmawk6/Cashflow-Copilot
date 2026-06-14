import { redirect } from 'next/navigation'
import { createClient, getOrganization, getUser } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsForm } from '@/components/settings/settings-form'
import { CsvImport } from '@/components/shared/csv-import'
import { DemoSeedButton } from '@/components/shared/demo-seed-button'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const [user, org] = await Promise.all([getUser(), getOrganization()])
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: followUpRules } = org
    ? await supabase.from('follow_up_rules').select('*').eq('organization_id', org.id)
    : { data: [] }

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
      <CsvImport />
      <DemoSeedButton />
    </div>
  )
}
