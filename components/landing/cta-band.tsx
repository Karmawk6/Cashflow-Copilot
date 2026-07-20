import Link from 'next/link'
import { BookACallButton } from './book-a-call-button'
import { LeadCaptureForm } from './lead-capture-form'
import { ScrollReveal } from './scroll-reveal'

export function CtaBand() {
  return (
    <section className="border-t bg-muted/40">
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <ScrollReveal>
          <h2 className="text-2xl font-semibold sm:text-3xl">
            The average consultancy has thousands of dollars sitting in
            unanswered proposals and unpaid invoices.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Recover it with a five-minute daily routine.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <BookACallButton className="px-10" />
            <p className="text-sm text-muted-foreground">
              Already a client?{' '}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
          <LeadCaptureForm />
        </ScrollReveal>
      </div>
    </section>
  )
}
