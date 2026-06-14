'use client'

import { useState, useRef } from 'react'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function CsvImport() {
  const [type, setType] = useState<'clients' | 'invoices' | 'proposals'>('clients')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; failed: number; total: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    try {
      const res = await fetch('/api/import/csv', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setResult(data)
      toast.success(`Imported ${data.imported} ${type}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const csvTemplates: Record<string, string> = {
    clients: 'company_name,contact_name,email,phone,status,notes\nAcme Corp,Jane Smith,jane@acme.com,555-1234,active,',
    invoices: 'company_name,invoice_number,title,amount,issue_date,due_date,status\nAcme Corp,INV-001,Web work,5000,2025-01-01,2025-01-30,sent',
    proposals: 'company_name,title,proposal_number,amount,sent_date,status\nAcme Corp,Brand Strategy,PROP-001,12000,2025-01-01,sent',
  }

  const downloadTemplate = () => {
    const content = csvTemplates[type]
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cashflow-copilot-${type}-template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">CSV Import</CardTitle>
        <CardDescription>Import clients, invoices, or proposals from a spreadsheet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Import type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
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

        <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 cursor-pointer hover:border-primary/50 transition-colors">
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm font-medium">Click to upload CSV</span>
          <span className="text-xs text-muted-foreground mt-1">or drag and drop</span>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="sr-only"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>

        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Importing...
          </div>
        )}

        {result && (
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2 font-medium text-sm">
              {result.failed === 0 ? (
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}
