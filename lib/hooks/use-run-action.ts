'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

/** The shared "call a server action, toast on error" pattern behind every
 *  mutation button. onSuccess is optional — actions that redirect on success
 *  never resolve here, so their callers pass nothing. */
export function useRunAction() {
  const [isPending, startTransition] = useTransition()

  const run = (action: () => Promise<{ error?: string } | void>, onSuccess?: () => void) => {
    startTransition(async () => {
      const result = await action()
      if (result?.error) toast.error(result.error)
      else onSuccess?.()
    })
  }

  return { isPending, run }
}
