import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { LandingHeader } from '@/components/landing/landing-header'
import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Screenshots } from '@/components/landing/screenshots'
import { FeaturesGrid } from '@/components/landing/features-grid'
import { CommunityLenders } from '@/components/landing/community-lenders'
import { StatsBand } from '@/components/landing/stats-band'
import { Testimonials } from '@/components/landing/testimonials'
import { Faq } from '@/components/landing/faq'
import { CtaBand } from '@/components/landing/cta-band'
import { LandingFooter } from '@/components/landing/landing-footer'

export default async function HomePage() {
  const user = await getUser()
  if (user) {
    redirect('/dashboard')
  }

  // `dark` is deliberately scoped to the landing page; text-foreground is
  // required because body's resolved color is inherited. `isolate` keeps the
  // -z-10 glow orbs above this div's background; overflow-x-clip stops them
  // from widening the page.
  return (
    <div className="dark isolate min-h-screen overflow-x-clip bg-background text-foreground [color-scheme:dark]">
      <LandingHeader />
      <main>
        <Hero />
        <HowItWorks />
        <Screenshots />
        <FeaturesGrid />
        <CommunityLenders />
        <StatsBand />
        <Testimonials />
        <Faq />
        <CtaBand />
      </main>
      <LandingFooter />
    </div>
  )
}
