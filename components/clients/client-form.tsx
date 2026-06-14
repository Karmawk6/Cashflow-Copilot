'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Client, ActionState } from '@/types/database'

interface ClientFormProps {
  client?: Client
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  title: string
}

export function ClientForm({ client, action, title }: ClientFormProps) {
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
              <Label htmlFor="company_name">Company name *</Label>
              <Input
                id="company_name"
                name="company_name"
                defaultValue={client?.company_name}
                required
                placeholder="Acme Corp"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_name">Contact name</Label>
              <Input
                id="contact_name"
                name="contact_name"
                defaultValue={client?.contact_name ?? ''}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={client?.status ?? 'active'}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="ghosted">Ghosted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={client?.email ?? ''}
                placeholder="jane@acmecorp.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={client?.phone ?? ''}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                defaultValue={client?.website ?? ''}
                placeholder="https://acmecorp.com"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={client?.notes ?? ''}
                placeholder="Any notes about this client..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : client ? 'Save changes' : 'Create client'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/clients">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
