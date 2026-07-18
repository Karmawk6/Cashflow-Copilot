import { NextResponse } from 'next/server'
import { createClient, getOrganization, getUser } from '@/lib/supabase/server'
import { jsonError, rateLimited } from '@/lib/api/http'
import { generateEmail } from '@/lib/ai/generate-email'
import { fillTemplate, pickTemplate } from '@/lib/email/templates'
import { rateLimit } from '@/lib/rate-limit'

// Every string that reaches the OpenAI prompt or a template gets capped so a
// crafted multi-megabyte "client name" can't inflate token spend.
const MAX_FIELD = 500

export async function POST(request: Request) {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return jsonError('Unauthorized', 401)

  // AI drafting costs real money per call — throttle bursts per user.
  const limited = rateLimit(`ai:${user.id}`, 10, 60_000)
  if (!limited.ok) {
    return rateLimited('Too many drafts at once — give it a few seconds and try again', limited.retryAfterSeconds)
  }

  try {
    const body = await request.json()
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return jsonError('Invalid request body', 400)
    }
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === 'string' && v.length > MAX_FIELD) body[k] = v.slice(0, MAX_FIELD)
    }

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
      if (!org) return jsonError('No organization', 403)

      const template = await pickTemplate(supabase, org.id, body.type, body.tone ?? 'professional')
      if (!template) {
        return jsonError('No template exists for this situation yet — add one under Templates', 404)
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
    return jsonError('Failed to generate email', 500)
  }
}
