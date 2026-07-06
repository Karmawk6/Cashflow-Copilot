'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AiEmailModal } from '@/components/shared/ai-email-modal'
import { updateFollowUpStatusAction } from '@/lib/actions/follow-ups'
import { toast } from 'sonner'
import type { EmailTemplateType } from '@/types/database'

interface FollowUpActionsProps {
  followUpId: string
  clientName: string
  contactName?: string | null
  clientEmail?: string | null
  type: 'invoice_reminder' | 'proposal_followup' | 'ghosted_checkin' | 'payment_upcoming'
  amount?: number
  currency?: string
  invoiceNumber?: string
  proposalTitle?: string
  dueDate?: string | null
  paymentLink?: string | null
}

const typeToEmailType: Record<string, EmailTemplateType> = {
  invoice_reminder: 'invoice_reminder',
  proposal_followup: 'proposal_followup',
  ghosted_checkin: 'ghosted_checkin',
  payment_upcoming: 'payment_upcoming',
}

export function FollowUpActions({
  followUpId,
  clientName,
  contactName,
  clientEmail,
  type,
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
          type: typeToEmailType[type],
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
