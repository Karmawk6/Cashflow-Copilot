import Image from 'next/image'
import { BrowserFrame } from './browser-frame'
import { ScrollReveal } from './scroll-reveal'
import dashboardShot from '@/public/screenshots/dashboard-dark.png'
import followUpsShot from '@/public/screenshots/follow-ups-dark.png'

export function Screenshots() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <ScrollReveal className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          The product
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Your money, at a glance
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          One dashboard shows what&apos;s unpaid, what&apos;s overdue, and
          what&apos;s at risk — and the follow-up queue turns it into a daily
          five-minute routine.
        </p>
      </ScrollReveal>
      <div className="mt-14 space-y-16">
        <ScrollReveal>
          <BrowserFrame url="duebird.io/dashboard">
            <Image
              src={dashboardShot}
              alt="Duebird dashboard showing unpaid invoices, overdue amounts, money at risk, and recommended next actions"
              placeholder="blur"
              sizes="(max-width: 1152px) 100vw, 1104px"
            />
          </BrowserFrame>
        </ScrollReveal>
        <ScrollReveal>
          <BrowserFrame url="duebird.io/follow-ups" className="mx-auto max-w-4xl">
            <Image
              src={followUpsShot}
              alt="Duebird follow-up queue with prioritized invoice reminders and proposal follow-ups, each with a draft email button"
              placeholder="blur"
              sizes="(max-width: 896px) 100vw, 848px"
            />
          </BrowserFrame>
        </ScrollReveal>
      </div>
    </section>
  )
}
