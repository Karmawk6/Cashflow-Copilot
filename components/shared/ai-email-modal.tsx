'use client'

import { useState } from 'react'
import { Sparkles, Copy, Send, RefreshCw, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { EmailTone, EmailTemplateType } from '@/types/database'

type DraftSource = 'template' | 'ai'

interface AiEmailModalProps {
  open: boolean
  onClose: () => void
  context: {
    type: EmailTemplateType
    clientName: string
    contactName?: string | null
    clientEmail?: string | null
    amount?: number
    currency?: string
    invoiceNumber?: string
    proposalTitle?: string
    dueDate?: string | null
    sentDate?: string | null
    daysOverdue?: number
    paymentLink?: string | null
  }
}

export function AiEmailModal({ open, onClose, context }: AiEmailModalProps) {
  const [source, setSource] = useState<DraftSource>('template')
  const [tone, setTone] = useState<EmailTone>('professional')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [templateName, setTemplateName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [sending, setSending] = useState(false)

  const generate = async (nextSource: DraftSource = source) => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...context, tone, source: nextSource }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setSubject(data.subject)
      setBody(data.body)
      setTemplateName(data.source === 'template' ? (data.templateName ?? 'Template') : null)
      setGenerated(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to draft the email')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    toast.success('Copied to clipboard')
  }

  const sendEmail = async () => {
    if (!context.clientEmail) {
      toast.error('No email address for this client')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: context.clientEmail,
          subject,
          body,
          context,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Send failed')

      // Be honest about what actually happened — a demo "send" is not a send.
      if (data.demo) {
        toast.warning(
          'No email sender is connected, so nothing was delivered. Connect Gmail in Settings to send for real.',
          { duration: 8000 }
        )
      } else if (data.via === 'gmail') {
        toast.success(`Sent to ${context.clientEmail} from your Gmail`)
      } else {
        toast.success(`Sent to ${context.clientEmail}`)
      }
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    setGenerated(false)
    setSubject('')
    setBody('')
    setTemplateName(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Draft Email
          </DialogTitle>
          <DialogDescription>
            Draft a follow-up for {context.clientName} from your saved templates, or write one with AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label className="mb-1.5 block">Draft from</Label>
              <Select value={source} onValueChange={(v) => setSource(v as DraftSource)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="template">Saved template (instant)</SelectItem>
                  <SelectItem value="ai">Write with AI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="mb-1.5 block">Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as EmailTone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="firm">Firm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => generate()} disabled={loading} variant={generated ? 'outline' : 'default'}>
              {loading ? (
                <><RefreshCw className="h-4 w-4 animate-spin mr-2" /> Drafting...</>
              ) : generated ? (
                <><RefreshCw className="h-4 w-4 mr-2" /> Redraft</>
              ) : source === 'template' ? (
                <><FileText className="h-4 w-4 mr-2" /> Draft</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Generate</>
              )}
            </Button>
          </div>

          {generated && (
            <div className="space-y-3">
              {templateName && (
                <p className="text-xs text-muted-foreground">
                  From template: <span className="font-medium text-foreground">{templateName}</span> — edit anything below before sending
                </p>
              )}
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Body</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {generated && (
            <>
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
              {context.clientEmail && (
                <Button onClick={sendEmail} disabled={sending}>
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send email'}
                </Button>
              )}
            </>
          )}
          {!generated && (
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
