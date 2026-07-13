import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Fake browser chrome around a product screenshot so the shot reads as "the
// real app" rather than a floating image.
export function BrowserFrame({
  url,
  children,
  className,
}: {
  url: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_24px_80px_-24px_hsl(229_60%_40%/0.45)] ring-1 ring-white/5',
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-border/60 bg-muted/40 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[hsl(0_60%_55%/0.8)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[hsl(45_80%_55%/0.8)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[hsl(140_50%_50%/0.8)]" />
        </div>
        <div className="mx-auto rounded-md bg-background/60 px-4 py-0.5 text-xs text-muted-foreground">
          {url}
        </div>
        <div className="w-10" />
      </div>
      {children}
    </div>
  )
}
