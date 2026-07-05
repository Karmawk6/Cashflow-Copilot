import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Dedicated sign-out endpoint: plain forms/links can hit this from anywhere,
// with no dependence on dropdown/menu event handling.
async function signOut(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 })
}

export async function POST(request: Request) {
  return signOut(request)
}

export async function GET(request: Request) {
  return signOut(request)
}
