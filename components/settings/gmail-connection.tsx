'use client'

import { useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Unplug, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { disconnectGmailAction } from '@/lib/actions/gmail'
import { toast } from 'sonner'

interface GmailConnectionCardProps {
  configured: boolean
  connection: { gmail_address: string; status: 'active' | 'error' } | null
}

const callbackMessages: Record<string, { kind: 'success' | 'error'; text: string }> = {
  connected: { kind: 'success', text: 'Gmail connected — follow-ups now send from your own address' },
  cancelled: { kind: 'error', text: 'Gmail connection was cancelled' },
  error: { kind: 'error', text: 'Could not connect Gmail — please try again' },
  not_configured: { kind: 'error', text: 'Gmail OAuth is not configured on this server yet' },
}

export function GmailConnectionCard({ configured, connection }: GmailConnectionCardProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Toast the OAuth outcome once, then drop the query param
  useEffect(() => {
    const outcome = searchParams.get('gmail')
    if (!outcome) return
    const message = callbackMessages[outcome]
    if (message) {
      if (message.kind === 'success') toast.success(message.text)
      else toast.error(message.text)
    }
    router.replace('/settings', { scroll: false })
  }, [searchParams, router])

  const disconnect = () => {
    startTransition(async () => {
      const result = await disconnectGmailAction()
      if (result?.error) toast.error(result.error)
      else toast.success('Gmail disconnected — emails fall back to the platform sender')
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email sending
        </CardTitle>
        <CardDescription>
          Connect your Gmail and every follow-up you approve is sent from your own
          address — replies land straight in your inbox.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {connection ? (
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`h-2 w-2 rounded-full ${connection.status === 'active' ? 'bg-success' : 'bg-destructive'}`}
              />
              <div>
                <p className="text-sm font-medium">{connection.gmail_address}</p>
                <p className="text-xs text-muted-foreground">
                  {connection.status === 'active'
                    ? 'Sending from your Gmail'
                    : 'Connection expired — reconnect below'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connection.status === 'error' && (
                <Button size="sm" asChild>
                  <a href="/api/gmail/connect">Reconnect</a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnect}
                disabled={isPending}
                className="text-muted-foreground hover:text-destructive"
              >
                <Unplug className="mr-1 h-3.5 w-3.5" />
                {isPending ? 'Disconnecting…' : 'Disconnect'}
              </Button>
            </div>
          </div>
        ) : configured ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Without a connection, emails go out via the platform sender instead.
            </p>
            <Button asChild>
              <a href="/api/gmail/connect">
                <Mail className="mr-2 h-4 w-4" />
                Connect Gmail
              </a>
            </Button>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-md bg-warning/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-muted-foreground">
              Gmail OAuth isn&apos;t configured yet — the server needs{' '}
              <Badge variant="outline" className="font-mono text-[11px]">GOOGLE_CLIENT_ID</Badge> and{' '}
              <Badge variant="outline" className="font-mono text-[11px]">GOOGLE_CLIENT_SECRET</Badge>.
              See <span className="font-mono text-xs">GMAIL_SETUP.md</span> in the repo.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
