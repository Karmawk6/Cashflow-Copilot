import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ScrollReveal } from './scroll-reveal'

const faqs = [
  {
    question: 'What is Duebird?',
    answer:
      'One dashboard for your clients, proposals, and invoices. Every morning it gives you a prioritized list of exactly who to follow up with — stale proposals, overdue invoices, quiet clients — with the email already drafted in your tone.',
  },
  {
    question: 'How do I get access, and what does it cost?',
    answer:
      'Duebird is invite-only. Book a call and we’ll walk through how you invoice today; pricing depends on your team size and volume, and you’ll get a number on the call. Once you’re in, we set up your workspace personally.',
  },
  {
    question: 'Does Duebird touch my money?',
    answer:
      'No — never. We don’t process, hold, or route client payments. You bring your own payment links, and your money goes straight to you.',
  },
  {
    question: 'Will it email my clients without asking me?',
    answer:
      'Never. Duebird drafts every follow-up for you, but a human — you — always reviews the email and hits send. Nothing goes to a client without your explicit approval.',
  },
  {
    question: 'Does Duebird work for CDFIs and loan funds?',
    answer:
      'Yes. Payment plans track repayment schedules — like "7 of 24 billed" — with a real invoice generated each period, borrowers get a courtesy reminder before each installment is due, and every borrower email is reviewed and approved by your staff before it sends.',
  },
  {
    question: 'Can my team use it?',
    answer:
      'Yes. Workspace owners can invite teammates by email from Settings, and everyone shares the same client list, pipeline, and follow-up queue. Seats are part of the pricing conversation on the call.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Each workspace’s data is isolated with database-level row security, we store no payment credentials, and nothing is ever sent to your clients without your approval.',
  },
  {
    question: 'What happens after I book a call?',
    answer:
      'A 30-minute call to see if Duebird fits. If it does, we send one invoice; once it’s paid, your email is approved for access, you create your account, and we onboard you personally — usually the same day.',
  },
]

export function Faq() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <ScrollReveal className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          FAQ
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Questions, answered
        </h2>
      </ScrollReveal>
      <ScrollReveal delay={100}>
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger className="text-base">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollReveal>
    </section>
  )
}
