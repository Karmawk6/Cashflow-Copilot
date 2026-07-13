import { Card, CardContent } from '@/components/ui/card'
import {
  Users,
  FileText,
  Receipt,
  BellRing,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { ScrollReveal } from './scroll-reveal'

const features = [
  {
    icon: Users,
    title: 'Client & prospect tracking',
    description:
      'Every client, prospect, and ghosted lead in one place — with last-contact dates so nothing slips.',
  },
  {
    icon: FileText,
    title: 'Proposal pipeline',
    description:
      'Track every proposal from draft to won, with follow-up cadences that flag the ones going cold.',
  },
  {
    icon: Receipt,
    title: 'Invoice chasing',
    description:
      'See overdue invoices at a glance and send reminders before cash flow becomes a problem.',
  },
  {
    icon: BellRing,
    title: 'Automatic follow-up queue',
    description:
      'A daily prioritized list of who to nudge — stale proposals, overdue invoices, quiet clients.',
  },
  {
    icon: Sparkles,
    title: 'AI-drafted follow-ups',
    description:
      'One click drafts the follow-up email in your tone — friendly, professional, or firm.',
  },
  {
    icon: TrendingUp,
    title: 'Cash flow analytics',
    description:
      'Outstanding revenue, win rates, and payment trends without touching a spreadsheet.',
  },
]

export function FeaturesGrid() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <ScrollReveal className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          Everything in one place
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Built for the way consultancies actually get paid
        </h2>
      </ScrollReveal>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <ScrollReveal key={feature.title} delay={index * 60} className="h-full">
            <Card className="h-full transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_8px_40px_-12px_hsl(229_60%_58%/0.35)]">
              <CardContent className="pt-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                  <feature.icon className="h-5 w-5 text-primary" />
                </span>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
