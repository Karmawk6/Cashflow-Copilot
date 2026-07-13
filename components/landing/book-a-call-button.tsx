import { Button } from '@/components/ui/button'

// The one CTA on the landing page. Duebird is pay-first: sales happens on a
// call, so every prominent button routes to Calendly — never to /signup.
export const CALENDLY_URL = 'https://calendly.com/duebird/30min'

export function BookACallButton({
  size = 'lg',
  className,
}: {
  size?: 'default' | 'lg'
  className?: string
}) {
  return (
    <Button size={size} asChild className={className}>
      <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
        Book a call
      </a>
    </Button>
  )
}
