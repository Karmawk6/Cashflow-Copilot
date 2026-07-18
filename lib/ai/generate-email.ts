import OpenAI from 'openai'
import type { EmailTemplateType, EmailTone } from '@/types/database'
import { formatCurrency, formatDateLong } from '@/lib/utils'

interface GenerateEmailParams {
  type: EmailTemplateType
  tone: EmailTone
  clientName: string
  clientEmail?: string | null
  amount?: number
  currency?: string
  invoiceNumber?: string
  proposalTitle?: string
  dueDate?: string | null
  sentDate?: string | null
  daysOverdue?: number
  paymentLink?: string | null
  businessType?: string
  senderName?: string
}

const toneGuide: Record<EmailTone, string> = {
  friendly: 'warm, empathetic, and personable — like a trusted advisor checking in',
  professional: 'polished, clear, and business-appropriate — respectful and direct',
  firm: 'direct and matter-of-fact — professional but leaving no ambiguity about urgency',
}

const typePrompt: Record<EmailTemplateType, string> = {
  proposal_followup: 'following up on a proposal or estimate that was sent and has not received a response',
  invoice_reminder: 'reminding a client about an outstanding invoice that is due or just became due',
  second_reminder: 'sending a second reminder for an invoice that is overdue and the client has not responded to the first reminder',
  final_nudge: 'sending a final notice for a significantly overdue invoice, making clear it needs immediate attention',
  ghosted_checkin: 'checking in with a prospect or client who has gone quiet after previous communication',
  payment_upcoming:
    'sending a courtesy heads-up that a recurring payment (retainer or installment) is coming due soon — the client is NOT late, so the tone should be light and appreciative, never pushy',
}

export async function generateEmail(params: GenerateEmailParams): Promise<{ subject: string; body: string }> {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  if (isDemoMode || !process.env.OPENAI_API_KEY) {
    return generateDemoEmail(params)
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const amountStr = params.amount ? formatCurrency(params.amount, params.currency) : null
  const overdueStr = params.daysOverdue ? `${params.daysOverdue} days overdue` : null

  const contextLines = [
    `Client: ${params.clientName}`,
    amountStr ? `Amount: ${amountStr}` : null,
    params.invoiceNumber ? `Invoice number: ${params.invoiceNumber}` : null,
    params.proposalTitle ? `Proposal: ${params.proposalTitle}` : null,
    params.dueDate ? `Due date: ${formatDateLong(params.dueDate)}` : null,
    params.sentDate ? `Sent date: ${formatDateLong(params.sentDate)}` : null,
    overdueStr ? `Status: ${overdueStr}` : null,
    params.paymentLink ? `Payment link: ${params.paymentLink}` : null,
    params.senderName ? `Sender: ${params.senderName}` : null,
  ].filter(Boolean).join('\n')

  const prompt = `You are helping a ${params.businessType ?? 'consultant'} write a follow-up email.

Situation: ${typePrompt[params.type]}

Context:
${contextLines}

Tone: ${toneGuide[params.tone]}

Write a concise, ${params.tone} follow-up email.

Requirements:
- Sound like a real human wrote it, not a template
- Keep it brief (3-4 short paragraphs max)
- Never threaten legal action
- Never be aggressive or rude
- If there's a payment link, naturally include it
- Do not use placeholder text like [Name] — use the actual details provided
- End with an appropriate sign-off

Return JSON with exactly two fields:
{
  "subject": "email subject line",
  "body": "full email body text"
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 600,
    temperature: 0.7,
  })

  const content = completion.choices[0].message.content
  if (!content) throw new Error('No content from OpenAI')

  const parsed = JSON.parse(content)
  return { subject: parsed.subject, body: parsed.body }
}

function generateDemoEmail(params: GenerateEmailParams): { subject: string; body: string } {
  const amountStr = params.amount ? formatCurrency(params.amount, params.currency) : 'the outstanding amount'

  const demos: Record<EmailTemplateType, { subject: string; body: string }> = {
    proposal_followup: {
      subject: `Quick follow-up on your proposal — ${params.proposalTitle ?? 'our proposal'}`,
      body: `Hi ${params.clientName},\n\nI wanted to follow up on the proposal I sent over${params.proposalTitle ? ` for ${params.proposalTitle}` : ''}. I know your plate is full, so I just wanted to make sure it landed and see if you had any questions.\n\nHappy to jump on a quick call to walk through anything or make adjustments if needed.\n\nLooking forward to potentially working together!\n\nBest,\n${params.senderName ?? 'Your Name'}`,
    },
    invoice_reminder: {
      subject: `Invoice ${params.invoiceNumber ?? '#'} — Payment Reminder`,
      body: `Hi ${params.clientName},\n\nI hope all is well! I'm reaching out regarding Invoice ${params.invoiceNumber ?? '#'} for ${amountStr}${params.dueDate ? `, due ${formatDateLong(params.dueDate, { year: false })}` : ''}.\n\nIf you've already sent payment, please disregard this message. Otherwise, I'd appreciate it if you could arrange payment at your convenience.${params.paymentLink ? `\n\nYou can pay securely here: ${params.paymentLink}` : ''}\n\nThank you!\n\n${params.senderName ?? 'Your Name'}`,
    },
    second_reminder: {
      subject: `Second Notice: Invoice ${params.invoiceNumber ?? '#'} — ${params.daysOverdue ?? 'Several'} Days Overdue`,
      body: `Hi ${params.clientName},\n\nI'm following up on my previous message regarding Invoice ${params.invoiceNumber ?? '#'} for ${amountStr}. This invoice is now ${params.daysOverdue ?? 'overdue'} days past due.\n\nI'd appreciate your prompt attention to this. Please process payment or reach out if you're experiencing any issues.${params.paymentLink ? `\n\nPayment link: ${params.paymentLink}` : ''}\n\nThank you,\n${params.senderName ?? 'Your Name'}`,
    },
    final_nudge: {
      subject: `Final Notice: Invoice ${params.invoiceNumber ?? '#'} Requires Immediate Attention`,
      body: `Hi ${params.clientName},\n\nI'm reaching out one more time regarding Invoice ${params.invoiceNumber ?? '#'} for ${amountStr}, which is significantly overdue.\n\nI value our working relationship and want to resolve this as quickly as possible. Please arrange payment or contact me immediately to discuss your situation.${params.paymentLink ? `\n\nPayment link: ${params.paymentLink}` : ''}\n\n${params.senderName ?? 'Your Name'}`,
    },
    ghosted_checkin: {
      subject: `Still thinking about working together?`,
      body: `Hi ${params.clientName},\n\nI wanted to reach out since we haven't connected in a while. Totally understand things get busy — just wanted to check in and see if you're still interested in moving forward.\n\nIf the timing isn't right or you've decided to go in a different direction, no worries at all. Just let me know either way so I can update my records.\n\nHope to hear from you!\n\n${params.senderName ?? 'Your Name'}`,
    },
    payment_upcoming: {
      subject: `Upcoming payment: Invoice ${params.invoiceNumber ?? '#'}${params.dueDate ? ` due ${formatDateLong(params.dueDate, { year: false })}` : ''}`,
      body: `Hi ${params.clientName},\n\nJust a friendly heads-up that your next payment of ${amountStr} (Invoice ${params.invoiceNumber ?? '#'}) is coming up${params.dueDate ? `, due ${formatDateLong(params.dueDate, { year: false })}` : ''}.\n\nIf your payment is already on the way, no action is needed — thank you! Otherwise, you can arrange it at your convenience.${params.paymentLink ? `\n\nYou can pay securely here: ${params.paymentLink}` : ''}\n\nThanks as always,\n${params.senderName ?? 'Your Name'}`,
    },
  }

  return demos[params.type]
}
