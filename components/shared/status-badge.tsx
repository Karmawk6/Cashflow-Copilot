import { Badge } from '@/components/ui/badge'
import type { InvoiceStatus, ProposalStatus, ClientStatus } from '@/types/database'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
type StatusConfig<T extends string> = Record<T, { label: string; variant: BadgeVariant }>

const invoiceStatusConfig: StatusConfig<InvoiceStatus> = {
  draft: { label: 'Draft', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'default' },
  paid: { label: 'Paid', variant: 'success' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  partially_paid: { label: 'Partial', variant: 'warning' },
  cancelled: { label: 'Cancelled', variant: 'outline' },
}

const proposalStatusConfig: StatusConfig<ProposalStatus> = {
  draft: { label: 'Draft', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'default' },
  viewed: { label: 'Viewed', variant: 'default' },
  follow_up_due: { label: 'Follow-up Due', variant: 'warning' },
  won: { label: 'Won', variant: 'success' },
  lost: { label: 'Lost', variant: 'outline' },
}

const clientStatusConfig: StatusConfig<ClientStatus> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  ghosted: { label: 'Ghosted', variant: 'destructive' },
  prospect: { label: 'Prospect', variant: 'default' },
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const config = invoiceStatusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const config = proposalStatusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const config = clientStatusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
