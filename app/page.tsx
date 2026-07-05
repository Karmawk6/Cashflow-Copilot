import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Users,
  FileText,
  Receipt,
  BellRing,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

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

export default async function HomePage() {
  const user = await getUser()
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold">CashFlow Copilot</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-6 pb-16 pt-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Stop losing revenue to
            <span className="text-primary"> forgotten follow-ups</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            CashFlow Copilot gives consultants and agencies one dashboard for
            clients, proposals, and invoices — and tells you exactly who to
            follow up with today, with the email already drafted.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">Start free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">See the demo</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required. Set up in under two minutes.
          </p>
          <p className="mx-auto mt-6 max-w-xl text-sm text-muted-foreground">
            Your money stays yours — we never process or hold client payments, you bring
            your own payment links. And every follow-up is drafted for you, but{' '}
            <span className="font-medium text-foreground">you always hit send</span>.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="pt-6">
                  <feature.icon className="h-8 w-8 text-primary" />
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t bg-muted/40">
          <div className="mx-auto max-w-4xl px-6 py-16 text-center">
            <h2 className="text-2xl font-semibold">
              The average consultancy has thousands of dollars sitting in
              unanswered proposals and unpaid invoices.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Recover it with a five-minute daily routine.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/signup">Get started free</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} CashFlow Copilot. Built for
          consultants, agencies, and CDFIs.
        </div>
      </footer>
    </div>
  )
}
