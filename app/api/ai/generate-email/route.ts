import { NextResponse } from 'next/server'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { generateEmail } from '@/lib/ai/generate-email'
import { fillTemplate, pickTemplate } from '@/lib/email/templates'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Sign-off name: whatever the caller sent, else the member's own name —
    // "The team" is a last resort, not a default.
    if (!body.senderName) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()
      if (profile?.full_name) body.senderName = profile.full_name
    }

    // Template mode: instant, predictable, uses the org's saved wording.
    // AI mode remains for when the user wants something bespoke.
    if (body.source === 'template') {
      const org = await getOrganization()
      if (!org) return NextResponse.json({ error: 'No organization' }, { status: 403 })

      const template = await pickTemplate(supabase, org.id, body.type, body.tone ?? 'professional')
      if (!template) {
        return NextResponse.json(
          { error: 'No template exists for this situation yet — add one under Templates' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        subject: fillTemplate(template.subject, body),
        body: fillTemplate(template.body, body),
        source: 'template',
        templateName: template.name,
      })
    }

    const result = await generateEmail(body)
    return NextResponse.json({ ...result, source: 'ai' })
  } catch (error) {
    console.error('Email draft error:', error)
    return NextResponse.json({ error: 'Failed to generate email' }, { status: 500 })
  }
}
