'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { submitLandingLead } from '@/lib/actions/landing'

export function LeadCaptureForm() {
  const [state, formAction, isPending] = useActionState(
    submitLandingLead,
    undefined
  )

  return (
    <div className="mt-10 border-t pt-8" aria-live="polite">
      {state?.success ? (
        <p className="text-sm font-medium">Got it — we&apos;ll be in touch.</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Not ready for a call? Leave your email and we&apos;ll reach out.
          </p>
          <form
            action={formAction}
            className="mx-auto mt-4 flex max-w-md flex-col gap-2 sm:flex-row"
          >
            {/* Honeypot: hidden from real visitors (and assistive tech); the
                action silently drops any submission that fills it. */}
            <div
              aria-hidden="true"
              className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
            >
              <label>
                Website
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </div>
            <label htmlFor="lead-email" className="sr-only">
              Email address
            </label>
            <Input
              id="lead-email"
              type="email"
              name="email"
              required
              placeholder="you@company.com"
              className="flex-1"
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Sending…' : 'Send'}
            </Button>
          </form>
          {state?.error && (
            <p className="mt-2 text-sm text-destructive">{state.error}</p>
          )}
        </>
      )}
    </div>
  )
}
