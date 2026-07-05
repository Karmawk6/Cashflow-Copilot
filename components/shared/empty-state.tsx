import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
      <div
        className={
          action
            ? 'flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'
            : 'flex h-12 w-12 items-center justify-center rounded-full bg-muted'
        }
      >
        <Icon className={action ? 'h-6 w-6 text-primary' : 'h-6 w-6 text-muted-foreground'} />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-xs">{description}</p>
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Button asChild size="sm">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
