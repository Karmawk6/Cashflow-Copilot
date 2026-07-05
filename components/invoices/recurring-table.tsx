import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScheduleActions } from './schedule-actions'
import type { RecurringScheduleWithClient, RecurringStatus } from '@/types/database'

const frequencyLabel: Record<string, string> = {
  weekly: 'weekly',
  biweekly: 'every 2 weeks',
  monthly: 'monthly',
  quarterly: 'quarterly',
  yearly: 'yearly',
}

const statusStyle: Record<RecurringStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  active: { label: 'Active', variant: 'default' },
  paused: { label: 'Paused', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'outline' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
}

export function RecurringTable({ schedules }: { schedules: RecurringScheduleWithClient[] }) {
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Schedule</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Next payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map((s) => {
            const style = statusStyle[s.status]
            const running = s.status === 'active' || s.status === 'paused'
            return (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.kind === 'payment_plan' ? 'Payment plan' : 'Retainer'}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {s.client?.company_name ?? '—'}
                </TableCell>
                <TableCell>
                  <div className="tabular-nums font-medium">{formatCurrency(s.amount, s.currency)}</div>
                  <div className="text-xs text-muted-foreground">{frequencyLabel[s.frequency]}</div>
                </TableCell>
                <TableCell className="text-sm">
                  {s.kind === 'payment_plan' && s.total_installments ? (
                    <>
                      <div className="tabular-nums">
                        {Math.min(s.installments_generated, s.total_installments)} of {s.total_installments} billed
                      </div>
                      {s.installments_generated < s.total_installments && (
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {formatCurrency((s.total_installments - s.installments_generated) * s.amount, s.currency)} to go
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">
                      {s.installments_generated} billed{s.end_date ? ` · ends ${formatDate(s.end_date)}` : ' · ongoing'}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {running ? formatDate(s.next_due_date) : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={style.variant}>{style.label}</Badge>
                </TableCell>
                <TableCell>
                  <ScheduleActions scheduleId={s.id} status={s.status} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
