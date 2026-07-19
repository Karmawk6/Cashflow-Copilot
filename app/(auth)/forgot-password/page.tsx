'use client'

import { Suspense, useActionState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormError } from '@/components/shared/form-error'
import { AuthNotice, type AuthNotices } from '@/components/shared/auth-notice'

// Messages arriving via redirect (expired or already-used recovery link).
const notices: AuthNotices = {
  recovery_failed: {
    text: 'That reset link is invalid or has expired — request a new one below.',
    tone: 'error',
  },
}

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined)

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Enter your email and we&apos;ll send you a reset link</CardDescription>
      </CardHeader>
      <CardContent>
        {state?.success ? (
          <div className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
            If an account exists for that email, we&apos;ve sent a password reset link. Check your inbox.
          </div>
        ) : (
          <form action={action} className="space-y-4">
            <Suspense>
              <AuthNotice notices={notices} />
            </Suspense>
            <FormError message={state?.error} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@agency.com" required autoComplete="email" />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Remembered it?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
