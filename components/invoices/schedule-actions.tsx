'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Pause, Play, XCircle, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { pauseScheduleAction, resumeScheduleAction, cancelScheduleAction } from '@/lib/actions/recurring'
import { toast } from 'sonner'
import type { RecurringStatus } from '@/types/database'

export function ScheduleActions({ scheduleId, status }: { scheduleId: string; status: RecurringStatus }) {
  const [isPending, startTransition] = useTransition()

  const run = (action: () => Promise<{ error?: string; success?: boolean }>, successMessage: string) => {
    startTransition(async () => {
      const result = await action()
      if (result?.error) toast.error(result.error)
      else toast.success(successMessage)
    })
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {(status === 'active' || status === 'paused') && (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/invoices/recurring/${scheduleId}/edit`}>
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
      {status === 'active' && (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => run(() => pauseScheduleAction(scheduleId), 'Schedule paused — no invoices until you resume')}
          title="Pause"
        >
          <Pause className="h-3.5 w-3.5" />
        </Button>
      )}
      {status === 'paused' && (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => run(() => resumeScheduleAction(scheduleId), 'Schedule resumed — missed periods are skipped, not back-billed')}
          title="Resume"
        >
          <Play className="h-3.5 w-3.5" />
        </Button>
      )}
      {(status === 'active' || status === 'paused') && (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (window.confirm('Cancel this recurring payment? Already-generated invoices are kept.')) {
              run(() => cancelScheduleAction(scheduleId), 'Schedule cancelled')
            }
          }}
          title="Cancel schedule"
        >
          <XCircle className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
