'use client'

import { useActionState } from 'react'
import { completeOnboarding } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const businessTypes = [
  { value: 'consulting', label: 'Consultant', desc: 'Solo or boutique consulting firm' },
  { value: 'agency', label: 'Agency', desc: 'Design, dev, marketing or service agency' },
  { value: 'freelance', label: 'Freelancer', desc: 'Independent contractor or freelancer' },
  { value: 'cdfi', label: 'CDFI', desc: 'Community development financial institution' },
]

export default function OnboardingPage() {
  const [state, action, pending] = useActionState(completeOnboarding, undefined)

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set up your workspace</CardTitle>
        <CardDescription>Tell us a bit about your business to personalize your experience</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-6">
          {state?.error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          )}
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
