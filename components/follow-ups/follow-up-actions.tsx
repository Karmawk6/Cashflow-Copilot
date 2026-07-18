'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PrioritySelect } from '@/components/shared/priority-select'
import { AiEmailModal } from '@/components/shared/ai-email-modal'
import { updateFollowUpStatusAction, updateFollowUpPriorityAction } from '@/lib/actions/follow-ups'
import { toast } from 'sonner'
import type { Priority } from '@/types/database'

interface FollowUpActionsProps {
  followUpId: string
  clientName: string
  contactName?: string | null
  clientEmail?: string | null
  type: 'invoice_reminder' | 'proposal_followup' | 'ghosted_checkin' | 'payment_upcoming'
  priority: Priority
  amount?: number
  currency?: string
  invoiceNumber?: string
  proposalTitle?: string
  dueDate?: string | null
  paymentLink?: string | null
}

export function FollowUpActions({
  followUpId,
  clientName,
  contactName,
  clientEmail,
  type,
  priority,
  amount,
  currency,
  invoiceNumber,
  proposalTitle,
  dueDate,
  paymentLink,
}: FollowUpActionsProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const markComplete = () => {
    startTransition(async () => {
      const result = await updateFollowUpStatusAction(followUpId, 'completed')
      if (result?.error) toast.error(result.error)
      else toast.success('Follow-up completed!')
    })
  }

  const skip = () => {
    startTransition(async () => {
      const result = await updateFollowUpStatusAction(followUpId, 'skipped')
      if (result?.error) toast.error(result.error)
      else toast('Follow-up skipped')
    })
  }

  return (
    <>
      <PrioritySelect
        priority={priority}
        action={(value) => updateFollowUpPriorityAction(followUpId, value as Priority)}
      />
      <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
        Draft email
      </Button>
      <Button variant="ghost" size="sm" onClick={markComplete} disabled={isPending}>
        <CheckCircle className="h-4 w-4 text-success" />
      </Button>
      <Button variant="ghost" size="sm" onClick={skip} disabled={isPending}>
        <SkipForward className="h-4 w-4 text-muted-foreground" />
      </Button>

      <AiEmailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        context={{
          type,
          clientName,
          contactName,
          clientEmail,
          amount,
          currency,
          invoiceNumber,
          proposalTitle,
          dueDate,
          paymentLink,
        }}
      />
    </>
  )
}
