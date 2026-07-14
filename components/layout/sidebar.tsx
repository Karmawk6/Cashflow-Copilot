'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Bell,
  Mail,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navGroups = [
  {
    label: null,
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/clients', icon: Users, label: 'Clients' },
      { href: '/proposals', icon: FileText, label: 'Proposals' },
      { href: '/invoices', icon: Receipt, label: 'Invoices' },
      { href: '/follow-ups', icon: Bell, label: 'Follow-Ups' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { href: '/templates', icon: Mail, label: 'Templates' },
      { href: '/analytics', icon: BarChart3, label: 'Analytics' },
      { href: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="relative isolate flex h-full w-60 flex-col overflow-hidden border-r border-white/10 bg-[hsl(228_30%_9%/0.88)] text-[hsl(220_20%_78%)] backdrop-blur-2xl backdrop-saturate-150">
      {/* Vibrancy: static color glows behind the nav give the glass depth.
          Parent is `relative isolate` so -z-10 keeps them under the content. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[hsl(229_80%_60%/0.16)] blur-[90px]" />
        <div className="absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-[hsl(280_65%_60%/0.12)] blur-[100px]" />
      </div>
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-white/10 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(229_70%_55%)] to-[hsl(280_55%_55%)] text-sm font-bold text-white">
          D
        </div>
        <span className="text-sm font-semibold text-white">Duebird</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-4 border-t border-white/10 pt-4' : undefined}>
            {group.label && (
              <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-[hsl(220_15%_50%)]">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isActive && 'text-[hsl(229_80%_74%)]'
                        )}
                      />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-2">
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
