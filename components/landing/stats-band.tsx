import { ScrollReveal } from './scroll-reveal'

// PLACEHOLDER numbers — replace with real customer data as it lands.
const stats = [
  { value: '5 min', label: 'daily routine to clear your follow-up queue' },
  { value: '3×', label: 'more follow-ups actually sent' },
  { value: '$0', label: 'of your money ever passes through us' },
  { value: '100%', label: 'of emails approved by you before sending' },
]

export function StatsBand() {
  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 text-center sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <ScrollReveal key={stat.label} delay={index * 80}>
            <p className="bg-gradient-to-r from-[hsl(229_80%_70%)] to-[hsl(280_65%_70%)] bg-clip-text text-4xl font-bold tracking-tight text-transparent">
              {stat.value}
            </p>
            <p className="mx-auto mt-2 max-w-[16rem] text-sm text-muted-foreground">
              {stat.label}
            </p>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
