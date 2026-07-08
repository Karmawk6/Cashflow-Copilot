'use client'

import { useTransition } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Priority } from '@/types/database'

// Mirrors the PriorityBadge colors so the trigger reads as the badge it replaces
const triggerStyles: Record<Priority, string> = {
  low: 'bg-secondary text-secondary-foreground',
  medium: 'bg-warning/15 text-warning-foreground dark:text-warning',
  high: 'bg-warning/25 text-warning-foreground dark:text-warning',
  critical: 'bg-destructive/12 text-destructive dark:text-[hsl(4_70%_70%)]',
}

interface PrioritySelectProps {
  priority: Priority
  action: (value: Priority | 'auto') => Promise<{ error?: string } | void>
  /** Label for the "hand it back to the engine" option, e.g. "Auto (by due date)".
   *  Omit to hide the auto option. */
  autoLabel?: string
}

/** Badge-looking dropdown for changing a priority in place. Controlled by the
 *  server-provided value: picking "auto" shows the recomputed level once the
 *  action's revalidate lands. */
export function PrioritySelect({ priority, action, autoLabel }: PrioritySelectProps) {
  const [isPending, startTransition] = useTransition()

  const change = (value: string) => {
    startTransition(async () => {
      const result = await action(value as Priority | 'auto')
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <Select value={priority} onValueChange={change} disabled={isPending}>
      <SelectTrigger
        aria-label="Change priority"
        className={cn(
          'h-7 w-auto gap-1 rounded-md border-transparent px-2.5 py-0.5 text-xs font-semibold',
          triggerStyles[priority]
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="low">Low</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="high">High</SelectItem>
        <SelectItem value="critical">Critical</SelectItem>
        {autoLabel && <SelectItem value="auto">{autoLabel}</SelectItem>}
      </SelectContent>
    </Select>
  )
}
