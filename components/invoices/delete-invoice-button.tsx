'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteInvoiceAction } from '@/lib/actions/invoices'
import { useRunAction } from '@/lib/hooks/use-run-action'

export function DeleteInvoiceButton({ invoiceId, invoiceNumber }: { invoiceId: string; invoiceNumber: string }) {
  const [open, setOpen] = useState(false)
  const { isPending, run } = useRunAction()

  // deleteInvoiceAction redirects on success, so no success handler here —
  // the dialog stays open until the redirect lands.
  const handleDelete = () => run(() => deleteInvoiceAction(invoiceId))

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 mr-2 text-destructive" />
        Delete
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete invoice #{invoiceNumber}?</DialogTitle>
            <DialogDescription>
              This permanently removes the invoice and its pending follow-ups. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
