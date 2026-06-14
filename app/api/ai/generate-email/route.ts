import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmail } from '@/lib/ai/generate-email'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const result = await generateEmail(body)
    return NextResponse.json(result)
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json({ error: 'Failed to generate email' }, { status: 500 })
  }
}
