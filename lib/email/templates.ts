import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, EmailTemplate, EmailTemplateType, EmailTone } from '@/types/database'
import { formatCurrency, formatDateLong } from '@/lib/utils'

export interface TemplateFillParams {
  clientName: string
  contactName?: string | null
  amount?: number
  currency?: string
  invoiceNumber?: string
  proposalTitle?: string
  dueDate?: string | null
  sentDate?: string | null
  paymentLink?: string | null
  senderName?: string
}

/**
 * Best template for the situation: the org's own template matching type+tone,
 * else the org's template of that type in any tone, else the shared default.
 */
export async function pickTemplate(
  supabase: SupabaseClient<Database>,
  orgId: string,
  type: EmailTemplateType,
  tone: EmailTone
): Promise<EmailTemplate | null> {
  const { data: candidates } = await supabase
    .from('email_templates')
    .select('*')
    .eq('type', type)
    .or(`organization_id.eq.${orgId},organization_id.is.null`)

  if (!candidates || candidates.length === 0) return null

  const rank = (t: EmailTemplate) =>
    (t.organization_id ? 0 : 2) + (t.tone === tone ? 0 : 1)

  return [...candidates].sort((a, b) => rank(a as EmailTemplate) - rank(b as EmailTemplate))[0] as EmailTemplate
}

/**
 * Fill the {{placeholder}} conventions used by the seeded templates:
 * simple {{name}} substitution plus {{#payment_link}}...{{/payment_link}}
 * conditional blocks that disappear when there is no link.
 */
export function fillTemplate(text: string, params: TemplateFillParams): string {
  let out = text

  // conditional blocks first
  out = out.replace(/\{\{#payment_link\}\}([\s\S]*?)\{\{\/payment_link\}\}/g, (_, inner) =>
    params.paymentLink ? inner : ''
  )

  const values: Record<string, string> = {
    contact_name: params.contactName || params.clientName,
    client_name: params.clientName,
    company_name: params.clientName,
    invoice_number: params.invoiceNumber ?? '',
    proposal_title: params.proposalTitle ?? '',
    amount: params.amount != null ? formatCurrency(params.amount, params.currency) : '',
    due_date: params.dueDate ? formatDateLong(params.dueDate) : '',
    sent_date: params.sentDate ? formatDateLong(params.sentDate) : '',
    payment_link: params.paymentLink ?? '',
    sender_name: params.senderName || 'The team',
  }

  out = out.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in values ? values[key] : match
  )

  // collapse the blank lines a removed conditional block leaves behind
  return out.replace(/\n{3,}/g, '\n\n').trim()
}
