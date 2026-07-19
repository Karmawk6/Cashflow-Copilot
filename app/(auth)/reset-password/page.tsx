'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { updatePassword } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormError } from '@/components/shared/form-error'

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, undefined)

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>Set a new password for your Duebird account</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <FormError message={state?.error} />
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" required autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" required autoComplete="new-password" />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Saving...' : 'Set new password'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Link expired?{' '}
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Request a new one
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
