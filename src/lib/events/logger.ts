import { supabase } from '../supabase/client'
import type { EventLog } from '../supabase/types'

export type EventType =
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'checklist_created'
  | 'checklist_updated'
  | 'checklist_checked'
  | 'checklist_unchecked'
  | 'status_changed'
  | 'comment_created'
  | 'template_generated'
  | 'template_updated'
  | 'schedule_exception_changed'
  | 'translation_requested'
  | 'translation_succeeded'
  | 'translation_failed'
  | 'notification_sent'
  | 'notification_opened'

export interface EventPayload {
  [key: string]: any
}

/**
 * Log an event to the database
 */
export async function logEvent(
  eventType: EventType,
  payload: EventPayload,
  userId?: string | null,
  taskId?: string | null,
  checklistItemId?: string | null
): Promise<void> {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('[Event Log]', eventType, payload)
      return
    }

    const { error } = await supabase.from('event_logs').insert({
      event_type: eventType,
      user_id: userId || null,
      task_id: taskId || null,
      checklist_item_id: checklistItemId || null,
      payload_json: payload,
    })

    if (error) {
      console.error('Failed to log event:', error)
    }
  } catch (error) {
    console.error('Error logging event:', error)
  }
}

/**
 * Get event logs with filters
 */
export async function getEventLogs(
  filters?: {
    eventType?: EventType
    userId?: string
    taskId?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }
): Promise<EventLog[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return []
    }

    let query = supabase.from('event_logs').select('*')

    if (filters?.eventType) {
      query = query.eq('event_type', filters.eventType)
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters?.taskId) {
      query = query.eq('task_id', filters.taskId)
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString())
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString())
    }

    query = query.order('created_at', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to get event logs:', error)
      return []
    }

    return (data as EventLog[]) || []
  } catch (error) {
    console.error('Error getting event logs:', error)
    return []
  }
}
