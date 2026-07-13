import { Card, CardContent } from '@/components/ui/card'
import { ScrollReveal } from './scroll-reveal'

// PLACEHOLDER quotes — swap for real customer quotes (name, role, company)
// as pilot feedback comes in.
const testimonials = [
  {
    quote:
      'Duebird paid for itself the first week — it surfaced two invoices I had completely forgotten about.',
    name: 'Placeholder name',
    role: 'Agency founder',
  },
  {
    quote:
      'The daily queue changed how I start my mornings. Five minutes and every follow-up is out the door.',
    name: 'Placeholder name',
    role: 'Independent consultant',
  },
  {
    quote:
      'I was nervous about tools that auto-email my clients. Duebird drafts everything but I always hit send.',
    name: 'Placeholder name',
    role: 'Studio owner',
  },
]

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <ScrollReveal className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          What clients say
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Trusted by people who bill for their time
        </h2>
      </ScrollReveal>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <ScrollReveal key={testimonial.role} delay={index * 80} className="h-full">
            <Card className="h-full">
              <CardContent className="flex h-full flex-col pt-6">
                <p className="text-2xl leading-none text-primary">&ldquo;</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground">
                  {testimonial.quote}
                </p>
                <div className="mt-5 border-t pt-4">
                  <p className="text-sm font-medium">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
