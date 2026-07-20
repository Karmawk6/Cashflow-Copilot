import { Card, CardContent } from '@/components/ui/card'
import { CalendarClock, BellRing, UserCheck } from 'lucide-react'
import { ScrollReveal } from './scroll-reveal'

const points = [
  {
    icon: CalendarClock,
    title: 'Payment plans built in',
    description:
      'Track loan repayment schedules — "7 of 24 billed" — with real invoices generated each period.',
  },
  {
    icon: BellRing,
    title: 'Pre-due courtesy reminders',
    description:
      'Borrowers get a friendly heads-up before each installment, so most payments never go overdue.',
  },
  {
    icon: UserCheck,
    title: 'Human approval as compliance',
    description:
      'Every borrower email is reviewed and approved by your staff before it sends — an audit-friendly, board-friendly workflow.',
  },
]

export function CommunityLenders() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <ScrollReveal className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          For community lenders
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Duebird for CDFIs and loan funds
        </h2>
      </ScrollReveal>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {points.map((point, index) => (
          <ScrollReveal key={point.title} delay={index * 60} className="h-full">
            <Card className="h-full transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_8px_40px_-12px_hsl(229_60%_58%/0.35)]">
              <CardContent className="pt-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                  <point.icon className="h-5 w-5 text-primary" />
                </span>
                <h3 className="mt-4 font-semibold">{point.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {point.description}
                </p>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
