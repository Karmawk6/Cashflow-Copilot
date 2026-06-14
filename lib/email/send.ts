import { Resend } from 'resend'

interface SendEmailParams {
  to: string
  subject: string
  body: string
  from?: string
}

export async function sendEmail({ to, subject, body, from }: SendEmailParams) {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  if (isDemoMode || !process.env.RESEND_API_KEY) {
    console.log('[DEMO] Would send email:', { to, subject })
    return { success: true, demo: true }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromAddress = from ?? process.env.RESEND_FROM_EMAIL ?? 'noreply@cashflowcopilot.com'

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject,
    text: body,
    html: body.replace(/\n/g, '<br>'),
  })

  if (error) throw new Error(error.message)
  return { success: true, messageId: data?.id }
}
