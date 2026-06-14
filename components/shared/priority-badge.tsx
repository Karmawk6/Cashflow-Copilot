import { Badge } from '@/components/ui/badge'
import type { Priority } from '@/types/database'
import { cn } from '@/lib/utils'

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  medium: { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  high: { label: 'High', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  critical: { label: 'Critical', className: 'bg-red-50 text-red-700 border-red-200' },
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
