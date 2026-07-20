import { BookACallButton } from './book-a-call-button'
import { GlowOrbs } from './glow-orbs'

// Above the fold: entrance animation is pure CSS (animate-fade-up + delays),
// never ScrollReveal — content must not depend on hydration to become visible.
export function Hero() {
  return (
    <section className="relative isolate">
      <GlowOrbs />
      <div className="mx-auto max-w-4xl px-6 pb-24 pt-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight motion-safe:animate-fade-up sm:text-6xl">
          Stop losing revenue to{' '}
          <span className="bg-[linear-gradient(90deg,hsl(229_80%_70%),hsl(280_65%_70%),hsl(320_70%_72%),hsl(229_80%_70%))] bg-[length:200%_100%] bg-clip-text text-transparent motion-safe:animate-gradient-pan">
            forgotten follow-ups
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground motion-safe:animate-fade-up motion-safe:[animation-delay:120ms]">
          Duebird gives consultants, agencies, and community lenders one
          dashboard for clients, proposals, and invoices — and tells you
          exactly who to follow up with today, with the email already drafted.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 motion-safe:animate-fade-up motion-safe:[animation-delay:240ms]">
          <BookACallButton className="px-10 shadow-[0_8px_32px_-8px_hsl(229_60%_58%/0.5)]" />
          <p className="text-sm text-muted-foreground">
            Invite-only. We onboard every workspace personally.
          </p>
        </div>
        <p className="mx-auto mt-8 max-w-xl text-sm text-muted-foreground motion-safe:animate-fade-up motion-safe:[animation-delay:360ms]">
          Your money stays yours — we never process or hold client payments,
          you bring your own payment links. And every follow-up is drafted for
          you, but <span className="font-medium text-foreground">you always hit send</span>.
        </p>
      </div>
    </section>
  )
}
