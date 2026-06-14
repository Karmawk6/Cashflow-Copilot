'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActivityType, Json } from '@/types/database'

interface LogActivityParams {
  orgId: string
  type: ActivityType
  entityType?: 'invoice' | 'proposal' | 'client' | 'follow_up'
  entityId?: string
  description: string
  metadata?: Record<string, Json>
}

export async function logActivity({
  orgId,
  type,
  entityType,
  entityId,
  description,
  metadata = {},
}: LogActivityParams) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('activities').insert({
      organization_id: orgId,
      user_id: user?.id ?? null,
      type,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      description,
      metadata: (metadata ?? {}) as Json,
    })
  } catch {
    // Never fail the main operation due to activity logging
    console.error('Failed to log activity')
  }
}
