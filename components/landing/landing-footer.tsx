import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
        <span>
          © {new Date().getFullYear()} Duebird. Built for consultants,
          agencies, and CDFIs.
        </span>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-foreground">
            Terms &amp; Conditions
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}
