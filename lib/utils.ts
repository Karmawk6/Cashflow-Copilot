import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  // Date-only strings ('2026-07-17') parse as UTC midnight; formatting them
  // in local time shows the previous day for anyone west of Greenwich. A
  // date-only value has no timezone — always render it as written.
  const isDateOnly = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(isDateOnly ? { timeZone: 'UTC' } : {}),
  }).format(d)
}

export function daysAgo(date: string | Date | null | undefined): number {
  if (!date) return 0
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

export function daysUntil(date: string | Date | null | undefined): number {
  if (!date) return 0
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function isOverdue(dueDate: string | Date | null | undefined): boolean {
  if (!dueDate) return false
  // Date-only: due TODAY is not overdue — comparing raw Dates would flag an
  // invoice overdue at midnight UTC on its own due date ("0d overdue").
  const d = typeof dueDate === 'string' ? dueDate.split('T')[0] : dueDate.toISOString().split('T')[0]
  return d < new Date().toISOString().split('T')[0]
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
