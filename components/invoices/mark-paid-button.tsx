'use client'

import { useTransition } from 'react'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markInvoicePaidAction } from '@/lib/actions/invoices'
import { toast } from 'sonner'

export function MarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      const result = await markInvoicePaidAction(invoiceId)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Invoice marked as paid!')
      }
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      <CheckCircle className="h-4 w-4 mr-2 text-success" />
      {isPending ? 'Marking...' : 'Mark paid'}
    </Button>
  )
}
