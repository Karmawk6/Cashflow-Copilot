'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AiEmailModal } from './ai-email-modal'
import type { EmailTemplateType } from '@/types/database'

interface AiEmailButtonProps {
  type: EmailTemplateType
  clientName: string
  clientEmail?: string | null
  amount?: number
  currency?: string
  invoiceNumber?: string
  proposalTitle?: string
  dueDate?: string | null
  sentDate?: string | null
  daysOverdue?: number
  paymentLink?: string | null
}

export function AiEmailButton(props: AiEmailButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Sparkles className="h-4 w-4 mr-2 text-primary" />
        Draft follow-up
      </Button>
      <AiEmailModal open={open} onClose={() => setOpen(false)} context={props} />
    </>
  )
}
