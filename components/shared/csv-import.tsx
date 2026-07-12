'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { Upload, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type ImportType = 'clients' | 'invoices' | 'proposals'

interface FieldDef {
  key: string
  label: string
  required?: boolean
  aliases: string[]
}

const fieldDefs: Record<ImportType, FieldDef[]> = {
  clients: [
    { key: 'company_name', label: 'Company name', required: true, aliases: ['company_name', 'company', 'business_name', 'business', 'organization', 'organisation', 'client_name', 'client', 'account', 'name'] },
    { key: 'contact_name', label: 'Contact name', aliases: ['contact_name', 'contact', 'full_name', 'contact_person'] },
    { key: 'first_name', label: 'First name', aliases: ['first_name', 'first', 'fname', 'given_name'] },
    { key: 'last_name', label: 'Last name', aliases: ['last_name', 'last', 'lname', 'surname', 'family_name'] },
    { key: 'email', label: 'Email', aliases: ['email', 'email_address', 'e_mail', 'contact_email'] },
    { key: 'phone', label: 'Phone', aliases: ['phone', 'phone_number', 'telephone', 'mobile', 'cell'] },
    { key: 'website', label: 'Website', aliases: ['website', 'url', 'web', 'site', 'domain'] },
    { key: 'status', label: 'Status', aliases: ['status', 'stage', 'state'] },
    { key: 'notes', label: 'Notes', aliases: ['notes', 'note', 'comments', 'description'] },
  ],
  invoices: [
    { key: 'company_name', label: 'Company name', required: true, aliases: ['company_name', 'company', 'business', 'organization', 'client_name', 'client', 'account'] },
    { key: 'invoice_number', label: 'Invoice number', required: true, aliases: ['invoice_number', 'invoice_no', 'invoice', 'number', 'inv', 'invoice_id'] },
    { key: 'title', label: 'Title / description', aliases: ['title', 'description', 'memo', 'project'] },
    { key: 'amount', label: 'Amount', required: true, aliases: ['amount', 'total', 'value', 'price', 'balance'] },
    { key: 'amount_paid', label: 'Amount paid', aliases: ['amount_paid', 'paid'] },
    { key: 'issue_date', label: 'Issue date', aliases: ['issue_date', 'invoice_date', 'date', 'created'] },
    { key: 'due_date', label: 'Due date', required: true, aliases: ['due_date', 'due', 'payment_due'] },
    { key: 'status', label: 'Status', aliases: ['status', 'state'] },
    { key: 'notes', label: 'Notes', aliases: ['notes', 'note', 'comments'] },
  ],
  proposals: [
    { key: 'company_name', label: 'Company name', required: true, aliases: ['company_name', 'company', 'business', 'organization', 'client_name', 'client', 'account'] },
    { key: 'title', label: 'Title', required: true, aliases: ['title', 'proposal_title', 'name', 'description', 'project'] },
    { key: 'proposal_number', label: 'Proposal number', aliases: ['proposal_number', 'proposal_no', 'number'] },
    { key: 'amount', label: 'Amount', required: true, aliases: ['amount', 'total', 'value', 'price'] },
    { key: 'sent_date', label: 'Sent date', aliases: ['sent_date', 'sent', 'date'] },
    { key: 'expiration_date', label: 'Expiration date', aliases: ['expiration_date', 'expires', 'valid_until', 'expiry'] },
    { key: 'status', label: 'Status', aliases: ['status', 'state'] },
    { key: 'notes', label: 'Notes', aliases: ['notes', 'note', 'comments'] },
  ],
}

const skipReasonLabels: Record<string, string> = {
  no_company_column: 'No company name on the row.',
  missing_invoice_fields: 'Missing a required invoice field (invoice number, amount, or due date).',
  missing_proposal_fields: 'Missing a required proposal field (title or amount).',
  client_not_found:
    'The company on this row is not in your Clients yet. Import or add clients first, with names that match.',
}

const DATE_KEYS = ['issue_date', 'due_date', 'sent_date', 'expiration_date']

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, '_')
}

interface ImportResult {
  imported: number
  skipped: number
  failed: number
  total: number
  skipReasons?: Record<string, number>
}

export function CsvImport() {
  const [type, setType] = useState<ImportType>('clients')
  const [parsed, setParsed] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const fields = fieldDefs[type]

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: ({ data, meta }) => {
        const headers = (meta.fields ?? []).filter(Boolean)
        if (headers.length === 0 || data.length === 0) {
          toast.error('Could not read any rows from that file')
          return
        }
        // Auto-guess: first unclaimed header matching each field's aliases
        const guess: Record<string, string> = {}
        const claimed = new Set<string>()
        for (const f of fieldDefs[type]) {
          const hit = headers.find((h) => !claimed.has(h) && f.aliases.includes(h))
          if (hit) {
            guess[f.key] = hit
            claimed.add(hit)
          }
        }
        setParsed({ headers, rows: data })
        setMapping(guess)
      },
      error: () => toast.error('Failed to parse the CSV file'),
    })
    if (fileRef.current) fileRef.current.value = ''
  }

  const reset = () => {
    setParsed(null)
    setMapping({})
  }

  const missingRequired = fields.filter((f) => f.required && !mapping[f.key])

  const runImport = async () => {
    if (!parsed) return
    setUploading(true)
    setResult(null)

    const mappedRows = parsed.rows
      .map((r) => {
        const out: Record<string, string> = {}
        for (const f of fields) {
          const src = mapping[f.key]
          if (src && r[src] != null && String(r[src]).trim() !== '') {
            out[f.key] = String(r[src]).trim()
          }
        }
        if (!out.contact_name && (out.first_name || out.last_name)) {
          out.contact_name = [out.first_name, out.last_name].filter(Boolean).join(' ')
        }
        delete out.first_name
        delete out.last_name
        for (const k of DATE_KEYS) {
          if (out[k]) {
            const d = new Date(out[k])
            if (!isNaN(d.getTime())) out[k] = d.toISOString().split('T')[0]
          }
        }
        if (out.status) out.status = out.status.toLowerCase().trim().replace(/\s+/g, '_')
        return out
      })
      .filter((r) => Object.values(r).some((v) => v))

    try {
      const res = await fetch('/api/import/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, rows: mappedRows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setParsed(null)
      if (data.imported > 0) toast.success(`Imported ${data.imported} ${type}`)
      else toast.warning('Nothing imported — see below for why rows were skipped')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setUploading(false)
    }
  }

  const csvTemplates: Record<string, string> = {
    clients: 'company_name,contact_name,email,phone,status,notes\nAcme Corp,Jane Smith,jane@acme.com,555-1234,active,',
    invoices: 'company_name,invoice_number,title,amount,issue_date,due_date,status\nAcme Corp,INV-001,Web work,5000,2025-01-01,2025-01-30,sent',
    proposals: 'company_name,title,proposal_number,amount,sent_date,status\nAcme Corp,Brand Strategy,PROP-001,12000,2025-01-01,sent',
  }

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplates[type]], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `duebird-${type}-template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV Import</CardTitle>
        <CardDescription>
          Drop a spreadsheet export from any tool — you&apos;ll match its columns to ours before
          anything is imported.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!parsed && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Import type</Label>
                <Select value={type} onValueChange={(v) => setType(v as ImportType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clients">Clients</SelectItem>
                    <SelectItem value="invoices">Invoices</SelectItem>
                    <SelectItem value="proposals">Proposals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="w-full">
                  Download template
                </Button>
              </div>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-primary/50">
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">Click to upload CSV</span>
              <span className="mt-1 text-xs text-muted-foreground">
                Any column names work — you&apos;ll map them next
              </span>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={handleFile}
              />
            </label>
          </>
        )}

        {parsed && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Match your columns{' '}
                <span className="text-muted-foreground font-normal">
                  ({parsed.rows.length} rows found)
                </span>
              </p>
              <Button variant="ghost" size="sm" onClick={reset}>
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Different file
              </Button>
            </div>

            <div className="space-y-2">
              {fields.map((f) => {
                const sample = mapping[f.key] ? parsed.rows[0]?.[mapping[f.key]] : undefined
                return (
                  <div key={f.key} className="grid grid-cols-[1fr_1.2fr_1fr] items-center gap-3">
                    <span className="text-sm">
                      {f.label}
                      {f.required && <span className="text-destructive"> *</span>}
                    </span>
                    <Select
                      value={mapping[f.key] ?? '__skip__'}
                      onValueChange={(v) =>
                        setMapping((m) => {
                          const next = { ...m }
                          if (v === '__skip__') delete next[f.key]
                          else next[f.key] = v
                          return next
                        })
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__skip__">— Skip —</SelectItem>
                        {parsed.headers.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="truncate text-xs text-muted-foreground">
                      {sample ? `e.g. ${sample}` : ''}
                    </span>
                  </div>
                )
              })}
            </div>

            {missingRequired.length > 0 && (
              <p className="text-sm text-warning-foreground">
                Map the required field{missingRequired.length > 1 ? 's' : ''}:{' '}
                {missingRequired.map((f) => f.label).join(', ')}
              </p>
            )}

            <Button
              onClick={runImport}
              disabled={uploading || missingRequired.length > 0}
              className="w-full"
            >
              {uploading ? 'Importing…' : `Import ${parsed.rows.length} rows`}
            </Button>
          </div>
        )}

        {result && (
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              {result.failed === 0 && result.imported > 0 ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <AlertCircle className="h-4 w-4 text-warning" />
              )}
              Import complete — {result.total} rows processed
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded bg-success/10 p-2 text-center">
                <div className="font-bold text-success">{result.imported}</div>
                <div className="text-xs text-muted-foreground">Imported</div>
              </div>
              <div className="rounded bg-muted p-2 text-center">
                <div className="font-bold">{result.skipped}</div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
              <div className="rounded bg-destructive/10 p-2 text-center">
                <div className="font-bold text-destructive">{result.failed}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>
            {result.skipped > 0 && result.skipReasons && Object.keys(result.skipReasons).length > 0 && (
              <div className="space-y-1.5 rounded-md bg-warning/10 p-3 text-xs">
                <p className="font-medium">Why rows were skipped:</p>
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                  {Object.entries(result.skipReasons).map(([reason, count]) => (
                    <li key={reason}>
                      <span className="font-medium text-foreground">
                        {count} row{count === 1 ? '' : 's'}:
                      </span>{' '}
                      {skipReasonLabels[reason] ?? reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
