import { redirect } from 'next/navigation'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { TemplateEditor } from '@/components/templates/template-editor'
import { Mail } from 'lucide-react'
import type { EmailTemplateType, EmailTone } from '@/types/database'

export const metadata = { title: 'Email Templates' }

const typeLabels: Record<EmailTemplateType, string> = {
  proposal_followup: 'Proposal Follow-Up',
  invoice_reminder: 'Invoice Reminder',
  second_reminder: 'Second Reminder',
  final_nudge: 'Final Nudge',
  ghosted_checkin: 'Ghosted Check-In',
}

const toneLabels: Record<EmailTone, string> = {
  friendly: 'Friendly',
  professional: 'Professional',
  firm: 'Firm',
}

export default async function TemplatesPage() {
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/onboarding')

  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .or(`organization_id.eq.${org.id},organization_id.is.null`)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage follow-up email templates. AI uses these as starting points.
          </p>
        </div>
        <TemplateEditor mode="create" orgId={org.id} />
      </div>

      {!templates || templates.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No templates"
          description="Create email templates for faster follow-ups."
        />
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="secondary">{typeLabels[template.type as EmailTemplateType]}</Badge>
                      <Badge variant="outline">{toneLabels[template.tone as EmailTone]}</Badge>
                      {template.is_default && <Badge variant="default">Default</Badge>}
                    </div>
                  </div>
                  {!template.is_default && (
                    <TemplateEditor mode="edit" template={template} orgId={org.id} />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground font-medium mb-1">Subject: {template.subject}</div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                  {template.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
