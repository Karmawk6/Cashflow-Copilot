'use client'

import { useSearchParams } from 'next/navigation'
import { FormError } from '@/components/shared/form-error'

export type AuthNotices = Record<string, { text: string; tone: 'info' | 'error' }>

// Banner for messages arriving via redirect (?notice= or ?error=), keyed into
// the caller's notices map. Reads useSearchParams — wrap in <Suspense>.
export function AuthNotice({ notices }: { notices: AuthNotices }) {
  const searchParams = useSearchParams()
  const key = searchParams.get('notice') ?? searchParams.get('error')
  const notice = key ? notices[key] : undefined
  if (!notice) return null
  if (notice.tone === 'error') return <FormError message={notice.text} />

  return (
    <div className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
      {notice.text}
    </div>
  )
}
