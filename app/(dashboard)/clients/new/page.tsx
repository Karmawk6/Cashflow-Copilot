import { createClientAction } from '@/lib/actions/clients'
import { ClientForm } from '@/components/clients/client-form'

export const metadata = { title: 'New Client' }

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add client</h1>
        <p className="text-muted-foreground text-sm mt-1">Create a new client record</p>
      </div>
      <ClientForm action={createClientAction} title="Client details" />
    </div>
  )
}
