'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Client, Proposal, ActionState } from '@/types/database'

interface ProposalFormProps {
  proposal?: Proposal
  clients: Client[]
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  title: string
  defaultClientId?: string
}

export function ProposalForm({ proposal, clients, action, title, defaultClientId }: ProposalFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined)

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
              <Select name="client_id" defaultValue={proposal?.client_id ?? defaultClientId}>
                <SelectTrigger id="client_id">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="title">Proposal title *</Label>
              <Input id="title" name="title" defaultValue={proposal?.title} placeholder="Website Redesign — Q3 2025" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proposal_number">Proposal #</Label>
              <Input id="proposal_number" name="proposal_number" defaultValue={proposal?.proposal_number ?? ''} placeholder="PROP-001" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0" defaultValue={proposal?.amount ?? ''} placeholder="0.00" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={proposal?.status ?? 'draft'}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="follow_up_due">Follow-up Due</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="follow_up_cadence_days">Follow-up cadence (days)</Label>
              <Input id="follow_up_cadence_days" name="follow_up_cadence_days" type="number" min="1" max="30" defaultValue={proposal?.follow_up_cadence_days ?? 3} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sent_date">Sent date</Label>
              <Input id="sent_date" name="sent_date" type="date" defaultValue={proposal?.sent_date ?? ''} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expiration_date">Expiration date</Label>
              <Input id="expiration_date" name="expiration_date" type="date" defaultValue={proposal?.expiration_date ?? ''} />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={proposal?.notes ?? ''} placeholder="Scope, context, or follow-up notes..." rows={3} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : proposal ? 'Save changes' : 'Create proposal'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/proposals">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
