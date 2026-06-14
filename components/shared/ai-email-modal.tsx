'use client'

import { useState } from 'react'
import { Sparkles, Copy, Send, RefreshCw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { EmailTone, EmailTemplateType } from '@/types/database'

interface AiEmailModalProps {
  open: boolean
  onClose: () => void
  context: {
    type: EmailTemplateType
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
  }
}

export function AiEmailModal({ open, onClose, context }: AiEmailModalProps) {
  const [tone, setTone] = useState<EmailTone>('professional')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [sending, setSending] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...context, tone }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      setSubject(data.subject)
      setBody(data.body)
      setGenerated(true)
    } catch {
      toast.error('Failed to generate email. Check your OpenAI API key.')
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
      if (!res.ok) throw new Error('Send failed')
      toast.success('Email sent!')
      onClose()
    } catch {
      toast.error('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    setGenerated(false)
    setSubject('')
    setBody('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Email Draft
          </DialogTitle>
          <DialogDescription>
            Generate a personalized follow-up email for {context.clientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
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
            <div className="flex items-end">
              <Button onClick={generate} disabled={loading} variant={generated ? 'outline' : 'default'}>
                {loading ? (
                  <><RefreshCw className="h-4 w-4 animate-spin mr-2" /> Generating...</>
                ) : generated ? (
                  <><RefreshCw className="h-4 w-4 mr-2" /> Regenerate</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Generate</>
                )}
              </Button>
            </div>
          </div>

          {generated && (
            <div className="space-y-3">
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
