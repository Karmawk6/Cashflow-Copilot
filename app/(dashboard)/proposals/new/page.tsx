import { redirect } from 'next/navigation'
import { createClient, getOrganization } from '@/lib/supabase/server'
import { createProposalAction } from '@/lib/actions/proposals'
import { ProposalForm } from '@/components/proposals/proposal-form'

export const metadata = { title: 'New Proposal' }

export default async function NewProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>
}) {
  const { client: defaultClientId } = await searchParams
  const supabase = await createClient()
  const org = await getOrganization()
  if (!org) redirect('/login')

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', org.id)
    .order('company_name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New proposal</h1>
        <p className="text-muted-foreground text-sm mt-1">Create a proposal to track with a client</p>
      </div>
      <ProposalForm
        clients={clients ?? []}
        action={createProposalAction}
        title="Proposal details"
        defaultClientId={defaultClientId}
      />
    </div>
  )
}
