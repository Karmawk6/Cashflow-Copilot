import { Badge } from '@/components/ui/badge'
import type { Priority } from '@/types/database'

const priorityConfig: Record<
  Priority,
  { label: string; variant: 'secondary' | 'warning' | 'destructive' }
> = {
  low: { label: 'Low', variant: 'secondary' },
  medium: { label: 'Medium', variant: 'warning' },
  high: { label: 'High', variant: 'warning' },
  critical: { label: 'Critical', variant: 'destructive' },
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority]
  return (
    <Badge variant={config.variant} className={priority === 'high' ? 'bg-warning/25' : undefined}>
      {config.label}
    </Badge>
  )
}
