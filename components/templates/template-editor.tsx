'use client'

import { useState, useActionState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { createTemplateAction, updateTemplateAction, deleteTemplateAction } from '@/lib/actions/templates'
import type { EmailTemplate } from '@/types/database'

interface TemplateEditorProps {
  mode: 'create' | 'edit'
  template?: EmailTemplate
  orgId: string
}

export function TemplateEditor({ mode, template }: TemplateEditorProps) {
  const [open, setOpen] = useState(false)

  const action = mode === 'edit' && template
    ? updateTemplateAction.bind(null, template.id)
    : createTemplateAction

  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <>
      {mode === 'create' ? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New template
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          <Pencil className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'New template' : 'Edit template'}</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-4">
            {(state as { error?: string })?.error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {(state as { error?: string }).error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Name</Label>
                <Input name="name" defaultValue={template?.name} placeholder="Invoice reminder — friendly" required />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select name="type" defaultValue={template?.type ?? 'invoice_reminder'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposal_followup">Proposal Follow-Up</SelectItem>
                    <SelectItem value="invoice_reminder">Invoice Reminder</SelectItem>
                    <SelectItem value="second_reminder">Second Reminder</SelectItem>
                    <SelectItem value="final_nudge">Final Nudge</SelectItem>
                    <SelectItem value="ghosted_checkin">Ghosted Check-In</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tone</Label>
                <Select name="tone" defaultValue={template?.tone ?? 'professional'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="firm">Firm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Subject</Label>
                <Input name="subject" defaultValue={template?.subject} placeholder="Invoice {{invoice_number}} — Payment Due" required />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Body</Label>
                <Textarea name="body" defaultValue={template?.body} rows={10} className="font-mono text-xs" required />
                <p className="text-xs text-muted-foreground">
                  Variables: {'{{contact_name}}'}, {'{{company_name}}'}, {'{{amount}}'}, {'{{invoice_number}}'}, {'{{due_date}}'}, {'{{sender_name}}'}
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              {mode === 'edit' && template && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    await deleteTemplateAction(template.id)
                    setOpen(false)
                  }}
                >
                  Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Saving...' : mode === 'create' ? 'Create' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
