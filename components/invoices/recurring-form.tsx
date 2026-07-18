'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FormError } from '@/components/shared/form-error'
import type { Client, RecurringSchedule, RecurringKind, ActionState } from '@/types/database'

interface RecurringFormProps {
  schedule?: RecurringSchedule
  clients: Client[]
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  title: string
  defaultClientId?: string
}

export function RecurringForm({ schedule, clients, action, title, defaultClientId }: RecurringFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const [kind, setKind] = useState<RecurringKind>(schedule?.kind ?? 'retainer')

  const today = new Date().toISOString().split('T')[0]

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          An invoice is created automatically for each period — reminders before the due
          date and overdue follow-ups all work like normal invoices.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <FormError message={state?.error} />

          {/* Retainer vs payment plan */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: 'retainer', label: 'Retainer', desc: 'Repeats until you pause or cancel it' },
                  { value: 'payment_plan', label: 'Payment plan', desc: 'A fixed number of installments (e.g. loan repayment)' },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="kind"
                    value={opt.value}
                    checked={kind === opt.value}
                    onChange={() => setKind(opt.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="client_id">Client *</Label>
              <Select name="client_id" defaultValue={schedule?.client_id ?? defaultClientId}>
                <SelectTrigger id="client_id">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={schedule?.title}
                placeholder={kind === 'payment_plan' ? 'Loan #204 repayment' : 'Monthly consulting retainer'}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount per payment ($) *</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0.01" defaultValue={schedule?.amount ?? ''} placeholder="0.00" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="frequency">Frequency</Label>
              <Select name="frequency" defaultValue={schedule?.frequency ?? 'monthly'}>
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="next_due_date">{schedule ? 'Next payment due *' : 'First payment due *'}</Label>
              <Input id="next_due_date" name="next_due_date" type="date" defaultValue={schedule?.next_due_date ?? today} required />
            </div>

            {kind === 'payment_plan' ? (
              <div className="space-y-1.5">
                <Label htmlFor="total_installments">Number of payments *</Label>
                <Input
                  id="total_installments"
                  name="total_installments"
                  type="number"
                  min="1"
                  max="360"
                  defaultValue={schedule?.total_installments ?? ''}
                  placeholder="24"
                  required
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="end_date">End date (optional)</Label>
                <Input id="end_date" name="end_date" type="date" defaultValue={schedule?.end_date ?? ''} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="remind_days_before">Remind client (days before due)</Label>
              <Input
                id="remind_days_before"
                name="remind_days_before"
                type="number"
                min="0"
                max="30"
                defaultValue={schedule?.remind_days_before ?? 3}
              />
              <p className="text-xs text-muted-foreground">0 = no heads-up, only overdue reminders</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payment_link">Payment link</Label>
              <Input id="payment_link" name="payment_link" defaultValue={schedule?.payment_link ?? ''} placeholder="https://pay.stripe.com/..." />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={schedule?.notes ?? ''} placeholder="Payment terms or internal notes..." rows={3} />
            </div>
          </div>

          {kind === 'payment_plan' && (
            <p className="text-xs text-muted-foreground">
              Progress shows as &ldquo;paid 3 of 24&rdquo; and the plan completes itself after the final installment.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : schedule ? 'Save changes' : 'Create recurring payment'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/invoices?tab=recurring">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
