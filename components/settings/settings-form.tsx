'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { Organization, Profile, FollowUpRule } from '@/types/database'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface SettingsFormProps {
  user: User
  profile: Profile | null
  org: Organization | null
  followUpRules: FollowUpRule[]
}

export function SettingsForm({ user, profile, org, followUpRules }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()

  const saveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: form.get('full_name') as string })
        .eq('id', user.id)
      if (error) toast.error('Failed to save profile')
      else toast.success('Profile updated')
    })
  }

  const saveOrg = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!org) return
    const form = new FormData(e.currentTarget)
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from('organizations')
        .update({ name: form.get('org_name') as string })
        .eq('id', org.id)
      if (error) toast.error('Failed to save')
      else toast.success('Organization updated')
    })
  }

  const saveFollowUpRules = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!org) return
    const form = new FormData(e.currentTarget)
    startTransition(async () => {
      const supabase = createClient()
      const ruleTypes = ['proposal', 'invoice', 'ghosted_lead'] as const
      for (const type of ruleTypes) {
        const existing = followUpRules.find(r => r.type === type)
        const data = {
          organization_id: org.id,
          type,
          days_until_followup: parseInt(form.get(`${type}_days_until_followup`) as string) || 3,
          days_until_escalate: parseInt(form.get(`${type}_days_until_escalate`) as string) || 7,
          days_until_critical: parseInt(form.get(`${type}_days_until_critical`) as string) || 14,
        }
        if (existing) {
          await supabase.from('follow_up_rules').update(data).eq('id', existing.id)
        } else {
          await supabase.from('follow_up_rules').insert(data)
        }
      }
      toast.success('Follow-up rules saved')
    })
  }

  const ruleFor = (type: string) => followUpRules.find(r => r.type === type)

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your personal account information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ''} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user.email ?? ''} disabled />
            </div>
            <Button type="submit" disabled={isPending}>Save profile</Button>
          </form>
        </CardContent>
      </Card>

      {/* Organization */}
      {org && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization</CardTitle>
            <CardDescription>Your workspace settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveOrg} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Business name</Label>
                <Input name="org_name" defaultValue={org.name} />
              </div>
              <div className="space-y-1.5">
                <Label>Business type</Label>
                <Input value={org.business_type} disabled className="capitalize" />
              </div>
              <Button type="submit" disabled={isPending}>Save organization</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Follow-up Rules */}
      {org && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Follow-Up Rules</CardTitle>
            <CardDescription>Configure when follow-ups are triggered automatically</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveFollowUpRules} className="space-y-6">
              {[
                { type: 'proposal', label: 'Proposal follow-ups' },
                { type: 'invoice', label: 'Invoice reminders' },
                { type: 'ghosted_lead', label: 'Ghosted lead check-ins' },
              ].map(({ type, label }) => {
                const rule = ruleFor(type)
                return (
                  <div key={type}>
                    <h4 className="text-sm font-medium mb-3">{label}</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">First follow-up (days)</Label>
                        <Input name={`${type}_days_until_followup`} type="number" min="1" max="30" defaultValue={rule?.days_until_followup ?? 3} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Escalate to high (days)</Label>
                        <Input name={`${type}_days_until_escalate`} type="number" min="1" max="60" defaultValue={rule?.days_until_escalate ?? 7} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Mark critical (days)</Label>
                        <Input name={`${type}_days_until_critical`} type="number" min="1" max="90" defaultValue={rule?.days_until_critical ?? 14} />
                      </div>
                    </div>
                  </div>
                )
              })}
              <Button type="submit" disabled={isPending}>Save rules</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
