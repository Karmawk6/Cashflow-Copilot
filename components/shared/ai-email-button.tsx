'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AiEmailModal } from './ai-email-modal'
import type { EmailContext } from '@/types/database'

export function AiEmailButton(props: EmailContext) {
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
