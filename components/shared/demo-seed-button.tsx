'use client'

import { useState } from 'react'
import { Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

export function DemoSeedButton() {
  const [loading, setLoading] = useState(false)

  const seed = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Demo data loaded! Refresh the dashboard.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to seed demo data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4" />
          Load Demo Data
        </CardTitle>
        <CardDescription>
          Populate your account with sample clients, invoices, and proposals to explore the app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={seed} disabled={loading}>
          {loading ? 'Loading...' : 'Load demo data'}
        </Button>
      </CardContent>
    </Card>
  )
}
