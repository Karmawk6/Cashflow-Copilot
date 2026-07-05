'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

export function DemoSeedButton() {
  const [pending, setPending] = useState<'seed' | 'clear' | null>(null)
  const router = useRouter()

  const run = async (action: 'seed' | 'clear') => {
    setPending(action)
    try {
      const res = await fetch('/api/seed', { method: action === 'seed' ? 'POST' : 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(action === 'seed' ? 'Demo data loaded!' : 'Demo data cleared.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action} demo data`)
    } finally {
      setPending(null)
    }
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4" />
          Demo Data
        </CardTitle>
        <CardDescription>
          Populate your workspace with sample clients, invoices, and proposals to explore the
          app — then clear them with one click. Only affects your own workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button variant="outline" onClick={() => run('seed')} disabled={pending !== null}>
          {pending === 'seed' ? 'Loading...' : 'Load demo data'}
        </Button>
        <Button variant="ghost" onClick={() => run('clear')} disabled={pending !== null} className="text-destructive hover:text-destructive">
          <Trash2 className="mr-1.5 h-4 w-4" />
          {pending === 'clear' ? 'Clearing...' : 'Clear demo data'}
        </Button>
      </CardContent>
    </Card>
  )
}
