'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const emptySubscribe = () => () => {}

export function AppearanceCard() {
  const { theme, setTheme } = useTheme()
  // The Select renders the stored theme value, which is unknowable on the
  // server — gate on mount to avoid a hydration mismatch. (setState-in-effect
  // is forbidden by lint, so use the useSyncExternalStore mounted idiom.)
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Appearance</CardTitle>
        <CardDescription>Choose how Duebird looks on this device</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="theme-select">Theme</Label>
          {mounted ? (
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme-select" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div aria-hidden className="h-9 w-48 rounded-md border border-input" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
