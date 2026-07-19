'use client'

import { useTheme } from 'next-themes'
import { Toaster } from 'sonner'

// theme="system" would track the OS, not the in-app choice — resolve it here.
export function AppToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      richColors
      position="top-right"
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
    />
  )
}
