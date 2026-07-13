import { ScrollReveal } from './scroll-reveal'

const steps = [
  {
    number: '1',
    title: 'Book a call',
    description:
      '30 minutes. We look at how you invoice today and whether Duebird actually fits your business.',
  },
  {
    number: '2',
    title: 'We set you up',
    description:
      'Once you’re in, your workspace arrives ready — clients, invoices, and follow-up cadences configured with you.',
  },
  {
    number: '3',
    title: 'Stop chasing',
    description:
      'Every morning Duebird tells you exactly who to nudge, with the email already drafted. You just hit send.',
  },
]

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <ScrollReveal className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          How it works
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          No self-serve maze. No credit card form.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          We work with a small number of consultancies and agencies and onboard
          each one personally.
        </p>
      </ScrollReveal>
      <div className="mt-14 grid gap-10 sm:grid-cols-3">
        {steps.map((step, index) => (
          <ScrollReveal key={step.number} delay={index * 100}>
            <div className="flex h-full flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(229_70%_55%)] to-[hsl(280_55%_55%)] text-lg font-bold text-white shadow-[0_4px_24px_-4px_hsl(229_60%_58%/0.5)]">
                {step.number}
              </span>
              <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
