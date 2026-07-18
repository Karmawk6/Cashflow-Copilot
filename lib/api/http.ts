import { NextResponse } from 'next/server'

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export function rateLimited(message: string, retryAfterSeconds: number) {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  )
}
