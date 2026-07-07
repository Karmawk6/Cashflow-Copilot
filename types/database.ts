export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Intersection helper: makes any type satisfy Record<string, unknown> for Supabase generic constraint.
// Without this, interfaces without index signatures fail the `extends GenericTable` check in conditional types.
type DbRow<T> = T & { [key: string]: unknown }

// Complete Database type that satisfies the Supabase generic constraint
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: DbRow<Organization>
        Insert: DbRow<Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>>
        Update: DbRow<Partial<Omit<Organization, 'id' | 'created_at'>>>
        Relationships: []
      }
      profiles: {
        Row: DbRow<Profile>
        Insert: DbRow<Partial<Omit<Profile, 'created_at' | 'updated_at'>>>
        Update: DbRow<Partial<Omit<Profile, 'id' | 'created_at'>>>
        Relationships: []
      }
      clients: {
        Row: DbRow<Client>
        Insert: DbRow<Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>>
        Update: DbRow<Partial<Omit<Client, 'id' | 'created_at'>>>
        Relationships: []
      }
      proposals: {
        Row: DbRow<Proposal>
        Insert: DbRow<Partial<Omit<Proposal, 'id' | 'created_at' | 'updated_at'>>>
        Update: DbRow<Partial<Omit<Proposal, 'id' | 'created_at'>>>
        Relationships: []
      }
      invoices: {
        Row: DbRow<Invoice>
        Insert: DbRow<Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>>>
        Update: DbRow<Partial<Omit<Invoice, 'id' | 'created_at'>>>
        Relationships: []
      }
      email_templates: {
        Row: DbRow<EmailTemplate>
        Insert: DbRow<Partial<Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>>>
        Update: DbRow<Partial<Omit<EmailTemplate, 'id' | 'created_at'>>>
        Relationships: []
      }
      follow_up_events: {
        Row: DbRow<FollowUpEvent>
        Insert: DbRow<Partial<Omit<FollowUpEvent, 'id' | 'created_at' | 'updated_at'>>>
        Update: DbRow<Partial<Omit<FollowUpEvent, 'id' | 'created_at'>>>
        Relationships: []
      }
      follow_up_rules: {
        Row: DbRow<FollowUpRule>
        Insert: DbRow<Partial<Omit<FollowUpRule, 'id' | 'created_at' | 'updated_at'>>>
        Update: DbRow<Partial<Omit<FollowUpRule, 'id' | 'created_at'>>>
        Relationships: []
      }
      activities: {
        Row: DbRow<Activity>
        Insert: DbRow<Partial<Omit<Activity, 'id' | 'created_at'>>>
        Update: DbRow<Partial<Omit<Activity, 'id' | 'created_at'>>>
        Relationships: []
      }
      invitations: {
        Row: DbRow<Invitation>
        Insert: DbRow<Partial<Omit<Invitation, 'id' | 'created_at'>>>
        Update: DbRow<Partial<Omit<Invitation, 'id' | 'created_at'>>>
        Relationships: []
      }
      recurring_schedules: {
        Row: DbRow<RecurringSchedule>
        Insert: DbRow<Partial<Omit<RecurringSchedule, 'id' | 'created_at' | 'updated_at'>>>
        Update: DbRow<Partial<Omit<RecurringSchedule, 'id' | 'created_at'>>>
        Relationships: []
      }
      gmail_connections: {
        Row: DbRow<GmailConnection>
        Insert: DbRow<Partial<Omit<GmailConnection, 'id' | 'created_at' | 'updated_at'>>>
        Update: DbRow<Partial<Omit<GmailConnection, 'id' | 'created_at'>>>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      accept_invitation: {
        Args: { invitation_id: string }
        Returns: undefined
      }
      my_pending_invitations: {
        Args: Record<string, never>
        Returns: { id: string; organization_name: string; role: string }[]
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export interface Invitation {
  id: string
  organization_id: string
  email: string
  role: 'owner' | 'member'
  status: 'pending' | 'accepted' | 'revoked'
  invited_by: string | null
  created_at: string
  accepted_at: string | null
}

export interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string
  business_type: 'consulting' | 'agency' | 'freelance' | 'cdfi'
  settings: Json
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  organization_id: string | null
  onboarded: boolean
  created_at: string
  updated_at: string
}

export type ClientStatus = 'active' | 'inactive' | 'ghosted' | 'prospect'

export interface Client {
  id: string
  organization_id: string
  company_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  status: ClientStatus
  notes: string | null
  tags: string[]
  last_contact_date: string | null
  created_at: string
  updated_at: string
}

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'follow_up_due' | 'won' | 'lost'
export type Priority = 'low' | 'medium' | 'high' | 'critical'

export interface Proposal {
  id: string
  organization_id: string
  client_id: string
  title: string
  proposal_number: string | null
  amount: number
  currency: string
  sent_date: string | null
  expiration_date: string | null
  status: ProposalStatus
  priority: Priority
  follow_up_cadence_days: number
  last_follow_up_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'partially_paid' | 'cancelled'

export interface Invoice {
  id: string
  organization_id: string
  client_id: string
  invoice_number: string
  title: string | null
  amount: number
  amount_paid: number
  currency: string
  issue_date: string
  due_date: string
  status: InvoiceStatus
  priority: Priority
  priority_manual: boolean
  payment_link: string | null
  notes: string | null
  last_reminder_date: string | null
  recurring_schedule_id: string | null
  created_at: string
  updated_at: string
}

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
export type RecurringKind = 'retainer' | 'payment_plan'
export type RecurringStatus = 'active' | 'paused' | 'completed' | 'cancelled'

export interface RecurringSchedule {
  id: string
  organization_id: string
  client_id: string
  title: string
  kind: RecurringKind
  amount: number
  currency: string
  frequency: RecurringFrequency
  next_due_date: string
  anchor_day: number
  end_date: string | null
  total_installments: number | null
  installments_generated: number
  remind_days_before: number
  status: RecurringStatus
  payment_link: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface GmailConnection {
  id: string
  user_id: string
  organization_id: string
  gmail_address: string
  access_token: string
  refresh_token: string
  token_expires_at: string
  status: 'active' | 'error'
  created_at: string
  updated_at: string
}

export type EmailTemplateType =
  | 'proposal_followup'
  | 'invoice_reminder'
  | 'second_reminder'
  | 'final_nudge'
  | 'ghosted_checkin'
  | 'payment_upcoming'

export type EmailTone = 'friendly' | 'professional' | 'firm'

export interface EmailTemplate {
  id: string
  organization_id: string | null
  name: string
  type: EmailTemplateType
  tone: EmailTone
  subject: string
  body: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export type FollowUpEventType = 'invoice_reminder' | 'proposal_followup' | 'ghosted_checkin' | 'payment_upcoming'
export type FollowUpEventStatus = 'pending' | 'sent' | 'completed' | 'skipped'

export interface FollowUpEvent {
  id: string
  organization_id: string
  client_id: string | null
  invoice_id: string | null
  proposal_id: string | null
  type: FollowUpEventType
  status: FollowUpEventStatus
  priority: Priority
  due_date: string | null
  sent_at: string | null
  email_subject: string | null
  email_body: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface FollowUpRule {
  id: string
  organization_id: string
  type: 'proposal' | 'invoice' | 'ghosted_lead'
  days_until_followup: number
  days_until_escalate: number
  days_until_critical: number
  auto_send: boolean
  template_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ActivityType =
  | 'email_sent'
  | 'email_drafted'
  | 'invoice_created'
  | 'invoice_updated'
  | 'invoice_paid'
  | 'proposal_created'
  | 'proposal_updated'
  | 'proposal_won'
  | 'proposal_lost'
  | 'client_created'
  | 'client_updated'
  | 'followup_completed'
  | 'followup_skipped'
  | 'schedule_created'
  | 'schedule_updated'
  | 'invoice_generated'

export interface Activity {
  id: string
  organization_id: string
  user_id: string | null
  type: ActivityType
  entity_type: 'invoice' | 'proposal' | 'client' | 'follow_up' | 'recurring_schedule' | null
  entity_id: string | null
  description: string
  metadata: Json
  created_at: string
}

// Joined types used in the UI
export interface ProposalWithClient extends Proposal {
  client: Pick<Client, 'company_name' | 'contact_name' | 'email'>
}

export interface RecurringScheduleWithClient extends RecurringSchedule {
  client: Pick<Client, 'company_name' | 'contact_name' | 'email'>
}

export interface InvoiceWithClient extends Invoice {
  client: Pick<Client, 'company_name' | 'contact_name' | 'email'>
}

export interface FollowUpWithRelations extends FollowUpEvent {
  client: Pick<Client, 'company_name' | 'contact_name' | 'email'> | null
  invoice: Pick<Invoice, 'invoice_number' | 'amount' | 'due_date'> | null
  proposal: Pick<Proposal, 'title' | 'amount' | 'sent_date'> | null
}

export type ActionState = { error?: string; success?: boolean } | undefined
