'use client'

import { usePathname } from 'next/navigation'

const titles: [string, string][] = [
  ['/dashboard', 'Dashboard'],
  ['/clients', 'Clients'],
  ['/proposals', 'Proposals'],
  ['/invoices', 'Invoices'],
  ['/follow-ups', 'Follow-Ups'],
  ['/templates', 'Templates'],
  ['/analytics', 'Analytics'],
  ['/settings', 'Settings'],
]

export function PageTitle() {
  const pathname = usePathname()
  const match = titles.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'))
  if (!match) return null
  return <span className="text-sm font-semibold">{match[1]}</span>
}
