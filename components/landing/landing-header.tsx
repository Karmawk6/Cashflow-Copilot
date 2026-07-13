import Link from 'next/link'
import { BookACallButton } from './book-a-call-button'

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="flex items-center gap-2.5 text-lg font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(229_70%_55%)] to-[hsl(280_55%_55%)] text-sm font-bold text-white">
            D
          </span>
          Duebird
        </span>
        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <BookACallButton size="default" />
        </div>
      </div>
    </header>
  )
}
