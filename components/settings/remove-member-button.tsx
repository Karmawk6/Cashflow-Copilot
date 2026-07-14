'use client'

import { useState, useTransition } from 'react'
import { UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { removeTeamMember } from '@/lib/actions/team'
import { toast } from 'sonner'

export function RemoveMemberButton({ memberId, memberLabel }: { memberId: string; memberLabel: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeTeamMember(memberId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(`${memberLabel} was removed from the workspace`)
        setOpen(false)
      }
    })
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-muted-foreground hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <UserMinus className="mr-1 h-3.5 w-3.5" /> Remove
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {memberLabel} from this workspace?</DialogTitle>
            <DialogDescription>
              They&apos;ll immediately lose access to the shared clients, proposals, invoices, and
              follow-ups. Everything they created stays with the workspace, and you can invite
              them back later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={isPending}>
              {isPending ? 'Removing...' : 'Remove member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
