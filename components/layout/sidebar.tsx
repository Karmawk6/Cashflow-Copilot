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
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/proposals', icon: FileText, label: 'Proposals' },
  { href: '/invoices', icon: Receipt, label: 'Invoices' },
  { href: '/follow-ups', icon: Bell, label: 'Follow-Ups' },
  { href: '/templates', icon: Mail, label: 'Templates' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-60 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          C
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm">CashFlow Copilot</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
          <TrendingUp className="h-4 w-4 text-success" />
          <span className="text-xs text-muted-foreground">Track. Follow up. Get paid.</span>
        </div>
      </div>
    </div>
  )
}
