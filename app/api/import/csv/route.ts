import { NextResponse } from 'next/server'
import { createClient, getOrganization, getUser } from '@/lib/supabase/server'
import { jsonError } from '@/lib/api/http'
import Papa from 'papaparse'
import type { ClientStatus, InvoiceStatus, ProposalStatus } from '@/types/database'

type ImportType = 'clients' | 'invoices' | 'proposals'

const MAX_FILE_BYTES = 2 * 1024 * 1024
const MAX_ROWS = 2000

// Escape ilike wildcards so CSV values match literally (a bare "%" would match every client).
function escapeLikePattern(term: string): string {
  return term.replace(/[\\%_]/g, '\\$&')
}

// Real-world CSVs name the company column many ways; accept the common ones.
function companyFrom(row: Record<string, string>): string {
  return (
    row.company_name || row.company || row.business_name || row.business ||
    row.organization || row.organisation || row.client_name || row.client ||
    row.account || row.name || ''
  ).trim()
}

function amountFrom(row: Record<string, string>): string {
  return row.amount || row.total || row.value || row.price || ''
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return jsonError('Unauthorized', 401)

  const org = await getOrganization()
  if (!org) return jsonError('No organization', 400)

  // Two entry modes: JSON with pre-mapped canonical rows (from the column-mapper
  // UI), or a raw CSV file upload that relies on header-alias guessing.
  let rows: Record<string, string>[]
  let type: ImportType
  let detectedHeaders: string[]

  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => null)
    type = body?.type
    const rawRows = body?.rows
    if (!type || !['clients', 'invoices', 'proposals'].includes(type) || !Array.isArray(rawRows)) {
      return jsonError('Missing type or rows', 400)
    }
    if (rawRows.length > MAX_ROWS) {
      return jsonError(`Too many rows (max ${MAX_ROWS})`, 413)
    }
    rows = rawRows.filter((r): r is Record<string, string> => typeof r === 'object' && r !== null)
    detectedHeaders = rows.length > 0 ? Object.keys(rows[0]) : []
  } else {
    const formData = await request.formData()
    const file = formData.get('file') as File
    type = formData.get('type') as ImportType

    if (!file || !type) {
      return jsonError('Missing file or type', 400)
    }

    if (file.size > MAX_FILE_BYTES) {
      return jsonError('File too large (max 2MB)', 413)
    }

    const text = await file.text()
    const { data, errors, meta } = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
    })

    if (errors.length > 0) {
      return jsonError('CSV parse error: ' + errors[0].message, 400)
    }

    if ((data as unknown[]).length > MAX_ROWS) {
      return jsonError(`Too many rows (max ${MAX_ROWS})`, 413)
    }

    rows = data as Record<string, string>[]
    detectedHeaders = meta.fields ?? []
  }

  let imported = 0
  let skipped = 0
  const failedRows: number[] = []
  const skipReasons: Record<string, number> = {}
  const skip = (reason: string) => {
    skipped++
    skipReasons[reason] = (skipReasons[reason] ?? 0) + 1
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    try {
      if (type === 'clients') {
        const companyName = companyFrom(row)
        if (!companyName) { skip('no_company_column'); continue }
        const { error } = await supabase.from('clients').insert({
          organization_id: org.id,
          company_name: companyName,
          contact_name: row.contact_name || row.contact || (row.name && row.name.trim() !== companyName ? row.name : null) || null,
          email: row.email || null,
          phone: row.phone || null,
          website: row.website || null,
          status: (['active', 'inactive', 'ghosted', 'prospect'].includes(row.status) ? row.status : 'active') as ClientStatus,
          notes: row.notes || null,
        })
        if (error) { failedRows.push(i + 2); continue }
        imported++

      } else if (type === 'invoices') {
        const invoiceNumber = row.invoice_number || row.invoice_no || row.invoice || row.number
        const amount = amountFrom(row)
        const dueDate = row.due_date || row.due
        if (!invoiceNumber || !amount || !dueDate) { skip('missing_invoice_fields'); continue }

        const company = companyFrom(row)
        let clientId: string | null = null
        if (company) {
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('organization_id', org.id)
            .ilike('company_name', escapeLikePattern(company))
            .single()
          clientId = client?.id ?? null
        }
        if (!clientId) { skip('client_not_found'); continue }

        const { error } = await supabase.from('invoices').insert({
          organization_id: org.id,
          client_id: clientId,
          invoice_number: invoiceNumber,
          title: row.title || row.description || null,
          amount: parseFloat(amount.replace(/[$,]/g, '')) || 0,
          amount_paid: parseFloat((row.amount_paid || row.paid || '0').replace(/[$,]/g, '')) || 0,
          issue_date: row.issue_date || row.date || new Date().toISOString().split('T')[0],
          due_date: dueDate,
          status: (['draft','sent','paid','overdue','partially_paid','cancelled'].includes(row.status) ? row.status : 'sent') as InvoiceStatus,
          notes: row.notes || null,
        })
        if (error) { failedRows.push(i + 2); continue }
        imported++

      } else if (type === 'proposals') {
        const title = row.title || row.proposal_title || row.description
        const amount = amountFrom(row)
        if (!title || !amount) { skip('missing_proposal_fields'); continue }

        const company = companyFrom(row)
        let clientId: string | null = null
        if (company) {
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('organization_id', org.id)
            .ilike('company_name', escapeLikePattern(company))
            .single()
          clientId = client?.id ?? null
        }
        if (!clientId) { skip('client_not_found'); continue }

        const { error } = await supabase.from('proposals').insert({
          organization_id: org.id,
          client_id: clientId,
          title,
          proposal_number: row.proposal_number || null,
          amount: parseFloat(amount.replace(/[$,]/g, '')) || 0,
          sent_date: row.sent_date || row.date || null,
          expiration_date: row.expiration_date || row.expires || null,
          status: (['draft','sent','viewed','follow_up_due','won','lost'].includes(row.status) ? row.status : 'sent') as ProposalStatus,
          notes: row.notes || null,
        })
        if (error) { failedRows.push(i + 2); continue }
        imported++
      }
    } catch {
      failedRows.push(i + 2)
    }
  }

  return NextResponse.json({
    imported,
    skipped,
    failed: failedRows.length,
    failedRows: failedRows.slice(0, 10),
    total: rows.length,
    skipReasons,
    detectedHeaders,
  })
}
