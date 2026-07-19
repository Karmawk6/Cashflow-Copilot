'use client'

import { Suspense, useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormError } from '@/components/shared/form-error'
import { AuthNotice, type AuthNotices } from '@/components/shared/auth-notice'

// Messages arriving via redirect (signup flow, email-confirmation link,
// password reset).
const notices: AuthNotices = {
  confirm_email_sent: {
    text: 'Account created! Check your email for a confirmation link, then sign in.',
    tone: 'info',
  },
  email_confirmed: {
    text: 'Email confirmed — sign in to continue.',
    tone: 'info',
  },
  confirmation_failed: {
    text: 'That confirmation link is invalid or has expired. Try signing in below.',
    tone: 'error',
  },
  password_updated: {
    text: 'Password updated — sign in with your new password.',
    tone: 'info',
  },
}

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your Duebird account</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <Suspense>
            <AuthNotice notices={notices} />
          </Suspense>
          <FormError message={state?.error} />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@agency.com" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input id="password" name="password" type="password" placeholder="••••••••" required autoComplete="current-password" />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
