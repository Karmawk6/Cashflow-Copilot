import { NextResponse } from 'next/server'
import { createClient, getOrganization } from '@/lib/supabase/server'
import Papa from 'papaparse'

type ImportType = 'clients' | 'invoices' | 'proposals'

const MAX_FILE_BYTES = 2 * 1024 * 1024
const MAX_ROWS = 2000

// Escape ilike wildcards so CSV values match literally (a bare "%" would match every client).
function escapeLikePattern(term: string): string {
  return term.replace(/[\\%_]/g, '\\$&')
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await getOrganization()
  if (!org) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const type = formData.get('type') as ImportType

  if (!file || !type) {
    return NextResponse.json({ error: 'Missing file or type' }, { status: 400 })
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 413 })
  }

  const text = await file.text()
  const { data: rows, errors } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
  })

  if (errors.length > 0) {
    return NextResponse.json({ error: 'CSV parse error: ' + errors[0].message }, { status: 400 })
  }

  if ((rows as unknown[]).length > MAX_ROWS) {
    return NextResponse.json({ error: `Too many rows (max ${MAX_ROWS})` }, { status: 413 })
  }

  let imported = 0
  let skipped = 0
  const failedRows: number[] = []

  for (let i = 0; i < (rows as Record<string, string>[]).length; i++) {
    const row = (rows as Record<string, string>[])[i]

    try {
      if (type === 'clients') {
        if (!row.company_name) { skipped++; continue }
        const { error } = await supabase.from('clients').insert({
          organization_id: org.id,
          company_name: row.company_name,
          contact_name: row.contact_name || row.name || null,
          email: row.email || null,
          phone: row.phone || null,
          website: row.website || null,
          status: (['active', 'inactive', 'ghosted', 'prospect'].includes(row.status) ? row.status : 'active') as 'active' | 'inactive' | 'ghosted' | 'prospect',
          notes: row.notes || null,
        })
        if (error) { failedRows.push(i + 2); continue }
        imported++

      } else if (type === 'invoices') {
        // Try to find client by company name or email
        if (!row.invoice_number || !row.amount || !row.due_date) { skipped++; continue }

        let clientId: string | null = null
        if (row.company_name || row.client_name || row.client) {
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('organization_id', org.id)
            .ilike('company_name', escapeLikePattern((row.company_name || row.client_name || row.client).trim()))
            .single()
          clientId = client?.id ?? null
        }
        if (!clientId) { skipped++; continue }

        const { error } = await supabase.from('invoices').insert({
          organization_id: org.id,
          client_id: clientId,
          invoice_number: row.invoice_number,
          title: row.title || row.description || null,
          amount: parseFloat(row.amount.replace(/[$,]/g, '')) || 0,
          amount_paid: parseFloat((row.amount_paid || row.paid || '0').replace(/[$,]/g, '')) || 0,
          issue_date: row.issue_date || row.date || new Date().toISOString().split('T')[0],
          due_date: row.due_date,
          status: (['draft','sent','paid','overdue','partially_paid','cancelled'].includes(row.status) ? row.status : 'sent') as 'draft' | 'sent' | 'paid' | 'overdue' | 'partially_paid' | 'cancelled',
          notes: row.notes || null,
        })
        if (error) { failedRows.push(i + 2); continue }
        imported++

      } else if (type === 'proposals') {
        if (!row.title || !row.amount) { skipped++; continue }

        let clientId: string | null = null
        if (row.company_name || row.client_name || row.client) {
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('organization_id', org.id)
            .ilike('company_name', escapeLikePattern((row.company_name || row.client_name || row.client).trim()))
            .single()
          clientId = client?.id ?? null
        }
        if (!clientId) { skipped++; continue }

        const { error } = await supabase.from('proposals').insert({
          organization_id: org.id,
          client_id: clientId,
          title: row.title,
          proposal_number: row.proposal_number || null,
          amount: parseFloat(row.amount.replace(/[$,]/g, '')) || 0,
          sent_date: row.sent_date || row.date || null,
          expiration_date: row.expiration_date || row.expires || null,
          status: (['draft','sent','viewed','follow_up_due','won','lost'].includes(row.status) ? row.status : 'sent') as 'draft' | 'sent' | 'viewed' | 'follow_up_due' | 'won' | 'lost',
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
    total: (rows as unknown[]).length,
  })
}
