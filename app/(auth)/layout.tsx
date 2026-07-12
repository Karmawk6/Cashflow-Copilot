import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
          C
        </div>
        <span className="text-xl font-semibold text-foreground">Duebird</span>
      </div>
      {children}
      <div className="mt-8 flex gap-4 text-xs text-muted-foreground">
        <Link href="/terms" className="hover:text-foreground">
          Terms &amp; Conditions
        </Link>
        <Link href="/privacy" className="hover:text-foreground">
          Privacy Policy
        </Link>
      </div>
    </div>
  )
}
