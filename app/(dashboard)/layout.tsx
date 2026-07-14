import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  // fixed inset-0 (not h-screen): portalled selects/toasts can briefly grow the
  // body taller than the viewport, and a trackpad scroll then drags an h-screen
  // shell out of view (sidebar footer ends mid-page). A fixed shell can't move.
  // The header lives INSIDE the scroll container (sticky, not a flex sibling)
  // so page content actually passes beneath its glass backdrop-blur.
  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <Sidebar />
      <div className="relative flex-1 overflow-y-auto bg-background">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
