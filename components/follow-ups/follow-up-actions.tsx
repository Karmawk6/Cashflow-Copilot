'use client'

import { useState } from 'react'
import { CheckCircle, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PrioritySelect } from '@/components/shared/priority-select'
import { AiEmailModal } from '@/components/shared/ai-email-modal'
import { updateFollowUpStatusAction, updateFollowUpPriorityAction } from '@/lib/actions/follow-ups'
import { useRunAction } from '@/lib/hooks/use-run-action'
import { toast } from 'sonner'
import type { EmailContext, FollowUpEventType, Priority } from '@/types/database'

interface FollowUpActionsProps extends Omit<EmailContext, 'type' | 'sentDate' | 'daysOverdue'> {
  followUpId: string
  type: FollowUpEventType
  priority: Priority
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
  const { isPending, run } = useRunAction()

  const markComplete = () =>
    run(() => updateFollowUpStatusAction(followUpId, 'completed'), () => toast.success('Follow-up completed!'))

  const skip = () =>
    run(() => updateFollowUpStatusAction(followUpId, 'skipped'), () => toast('Follow-up skipped'))

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
