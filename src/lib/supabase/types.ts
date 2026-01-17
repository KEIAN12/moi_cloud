export type UserRole = 'admin' | 'coadmin' | 'worker'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'
export type Language = 'ja' | 'fr'

export interface User {
  id: string
  name: string
  role: UserRole
  default_language: Language
  created_at: string
  updated_at: string
}

export interface Device {
  id: string
  device_identifier: string
  user_id: string
  last_seen_at: string
  created_at: string
}

export interface Week {
  id: string
  week_key: string // e.g., "2026-W04"
  business_date_default: string // ISO date
  business_date_actual: string | null // ISO date (null if no exception)
  created_at: string
}

export interface Task {
  id: string
  week_id: string
  title_ja: string
  title_fr: string | null
  body_ja: string | null
  body_fr: string | null
  due_at: string
  priority: Priority
  status: TaskStatus
  tag: string | null
  assignee_user_id: string | null
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
  translated_at: string | null
  needs_retranslate: boolean
}

export interface ChecklistItem {
  id: string
  task_id: string
  text_ja: string
  text_fr: string | null
  assignee_user_id: string
  due_at: string | null
  is_done: boolean
  done_by: string | null
  done_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
  translated_at: string | null
  needs_retranslate: boolean
}

export interface Comment {
  id: string
  task_id: string
  author_user_id: string
  body_ja: string
  body_fr: string | null
  created_at: string
  translated_at: string | null
  needs_retranslate: boolean
}

export interface Template {
  id: string
  name: string
  is_active: boolean
  version: number
  created_at: string
  updated_at: string
}

export interface TemplateTask {
  id: string
  template_id: string
  title_ja: string
  body_ja: string
  relative_due_rule: string // e.g., "-4 days 20:00"
  tag: string | null
  sort_order: number
  created_at: string
}

export interface TemplateChecklistItem {
  id: string
  template_task_id: string
  text_ja: string
  default_assignee_role_or_user: string // role or user_id
  sort_order: number
  created_at: string
}

export interface GlossaryTerm {
  id: string
  ja_term: string
  fr_term: string
  note: string | null
  created_at: string
  updated_at: string
}

export interface EventLog {
  id: string
  event_type: string
  user_id: string | null
  task_id: string | null
  checklist_item_id: string | null
  payload_json: Record<string, unknown>
  created_at: string
}

export interface Recommendation {
  id: string
  type: string
  payload_json: Record<string, unknown>
  status: 'proposed' | 'approved' | 'rejected'
  created_at: string
  decided_by: string | null
  decided_at: string | null
}
