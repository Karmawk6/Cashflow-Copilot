'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Client, Invoice, ActionState } from '@/types/database'

interface InvoiceFormProps {
  invoice?: Invoice
  clients: Client[]
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  title: string
  defaultClientId?: string
}

export function InvoiceForm({ invoice, clients, action, title, defaultClientId }: InvoiceFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined)

  const today = new Date().toISOString().split('T')[0]

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          {(state as { error?: string })?.error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {(state as { error?: string }).error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="client_id">Client *</Label>
              <Select name="client_id" defaultValue={invoice?.client_id ?? defaultClientId}>
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

            <div className="space-y-1.5">
              <Label htmlFor="invoice_number">Invoice # *</Label>
              <Input id="invoice_number" name="invoice_number" defaultValue={invoice?.invoice_number} placeholder="INV-001" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Description</Label>
              <Input id="title" name="title" defaultValue={invoice?.title ?? ''} placeholder="Web development — June 2025" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0" defaultValue={invoice?.amount ?? ''} placeholder="0.00" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount_paid">Amount paid ($)</Label>
              <Input id="amount_paid" name="amount_paid" type="number" step="0.01" min="0" defaultValue={invoice?.amount_paid ?? 0} placeholder="0.00" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="issue_date">Issue date *</Label>
              <Input id="issue_date" name="issue_date" type="date" defaultValue={invoice?.issue_date ?? today} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="due_date">Due date *</Label>
              <Input id="due_date" name="due_date" type="date" defaultValue={invoice?.due_date} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={invoice?.status ?? 'draft'}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue={invoice?.priority_manual ? invoice.priority : 'auto'}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (based on due date)</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="payment_link">Payment link</Label>
              <Input id="payment_link" name="payment_link" defaultValue={invoice?.payment_link ?? ''} placeholder="https://pay.stripe.com/..." />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={invoice?.notes ?? ''} placeholder="Payment terms, bank details, or notes..." rows={3} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : invoice ? 'Save changes' : 'Create invoice'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/invoices">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
