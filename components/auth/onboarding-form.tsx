'use client'

import { useActionState } from 'react'
import { completeOnboarding } from '@/lib/actions/auth'
import { acceptInvitation } from '@/lib/actions/team'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FormError } from '@/components/shared/form-error'
import { UserPlus } from 'lucide-react'

const businessTypes = [
  { value: 'consulting', label: 'Consultant', desc: 'Solo or boutique consulting firm' },
  { value: 'agency', label: 'Agency', desc: 'Design, dev, marketing or service agency' },
  { value: 'freelance', label: 'Freelancer', desc: 'Independent contractor or freelancer' },
  { value: 'cdfi', label: 'CDFI', desc: 'Community development financial institution' },
]

interface PendingInvitation {
  id: string
  organization_name: string
  role: string
}

export function OnboardingForm({
  invitations,
  inviteError,
}: {
  invitations: PendingInvitation[]
  inviteError?: boolean
}) {
  const [state, action, pending] = useActionState(completeOnboarding, undefined)

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set up your workspace</CardTitle>
        <CardDescription>
          {invitations.length > 0
            ? 'Join your team, or create a workspace of your own'
            : 'Tell us a bit about your business to personalize your experience'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {inviteError && (
          <FormError message="That invitation could not be accepted — it may have been revoked. Ask your workspace owner to re-invite you, or create your own workspace below." />
        )}

        {invitations.length > 0 && (
          <>
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{inv.organization_name}</p>
                      <p className="text-xs text-muted-foreground">
                        You&apos;ve been invited to join this workspace
                      </p>
                    </div>
                  </div>
                  <form action={acceptInvitation.bind(null, inv.id)}>
                    <Button type="submit" size="sm">
                      Join
                    </Button>
                  </form>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or create your own</span>
              <Separator className="flex-1" />
            </div>
          </>
        )}

        <form action={action} className="space-y-6">
          <FormError message={state?.error} />
          <div className="space-y-2">
            <Label htmlFor="fullName">Your name</Label>
            <Input id="fullName" name="fullName" type="text" placeholder="Alex Johnson" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgName">Business / organization name</Label>
            <Input id="orgName" name="orgName" type="text" placeholder="Apex Consulting" required />
          </div>
          <div className="space-y-3">
            <Label>What best describes you?</Label>
            {businessTypes.map((type) => (
              <label
                key={type.value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name="businessType"
                  value={type.value}
                  defaultChecked={type.value === 'consulting'}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs text-muted-foreground">{type.desc}</div>
                </div>
              </label>
            ))}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Setting up...' : 'Get started'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
