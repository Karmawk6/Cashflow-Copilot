'use client'

import { useActionState } from 'react'
import { Users, Crown, X } from 'lucide-react'
import { inviteTeammate, revokeInvitation } from '@/lib/actions/team'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Invitation } from '@/types/database'

interface Member {
  id: string
  email: string
  full_name: string | null
}

export function TeamSection({
  members,
  invitations,
  ownerId,
  isOwner,
  appUrl,
}: {
  members: Member[]
  invitations: Invitation[]
  ownerId: string
  isOwner: boolean
  appUrl: string
}) {
  const [state, action, pending] = useActionState(inviteTeammate, undefined)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Team
        </CardTitle>
        <CardDescription>
          Everyone in this workspace shares the same clients, proposals, invoices, and
          follow-ups.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">{m.full_name ?? m.email}</p>
                {m.full_name && <p className="text-xs text-muted-foreground">{m.email}</p>}
              </div>
              {m.id === ownerId ? (
                <Badge variant="secondary" className="gap-1">
                  <Crown className="h-3 w-3" /> Owner
                </Badge>
              ) : (
                <Badge variant="outline">Member</Badge>
              )}
            </div>
          ))}
        </div>

        {isOwner && (
          <>
            {invitations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pending invitations
                </p>
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-md border border-dashed px-3 py-2"
                  >
                    <p className="text-sm">{inv.email}</p>
                    <form action={revokeInvitation.bind(null, inv.id)}>
                      <Button type="submit" variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-destructive">
                        <X className="mr-1 h-3.5 w-3.5" /> Revoke
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            )}

            <form action={action} className="space-y-2">
              <div className="flex gap-2">
                <Input
                  name="email"
                  type="email"
                  placeholder="teammate@company.com"
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={pending}>
                  {pending ? 'Inviting...' : 'Invite'}
                </Button>
              </div>
              {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
              {state?.success && (
                <p className="text-sm text-success">
                  Invitation created. Ask them to sign up at{' '}
                  <span className="font-medium">{appUrl}</span> with that exact email — they&apos;ll
                  be offered to join this workspace automatically.
                </p>
              )}
            </form>
          </>
        )}
      </CardContent>
    </Card>
  )
}
