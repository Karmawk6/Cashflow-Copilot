'use client'

import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markInvoicePaidAction } from '@/lib/actions/invoices'
import { useRunAction } from '@/lib/hooks/use-run-action'
import { toast } from 'sonner'

export function MarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const { isPending, run } = useRunAction()

  const handleClick = () =>
    run(() => markInvoicePaidAction(invoiceId), () => toast.success('Invoice marked as paid!'))

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      <CheckCircle className="h-4 w-4 mr-2 text-success" />
      {isPending ? 'Marking...' : 'Mark paid'}
    </Button>
  )
}
