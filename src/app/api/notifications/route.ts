import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// GET /api/notifications - Get notifications for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')
    const unreadOnly = searchParams.get('unread_only') === 'true'

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    // For MVP, we'll generate notifications on-the-fly from event logs
    // In the future, we might want a dedicated notifications table

    // Get recent events that might generate notifications
    const { data: events, error } = await supabase
      .from('event_logs')
      .select('*')
      .or(`user_id.eq.${userId},payload_json->>assignee_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform events into notifications
    const notifications = (events || [])
      .map((event) => {
        // Check if this event should generate a notification
        if (event.event_type === 'checklist_checked' && event.user_id === userId) {
          // Self-action, no notification needed
          return null
        }

        let message = ''
        let type: 'info' | 'warning' | 'success' = 'info'
        let link = ''

        switch (event.event_type) {
          case 'task_created':
            if (event.payload_json?.assignee_user_id === userId) {
              message = `新しいタスクが割り当てられました: ${event.payload_json?.title_ja || 'タスク'}`
              link = `/tasks/${event.task_id}`
            }
            break
          case 'checklist_created':
            if (event.payload_json?.assignee_user_id === userId) {
              message = `新しいチェック項目が追加されました: ${event.payload_json?.text_ja || '項目'}`
              link = `/tasks/${event.task_id}`
            }
            break
          case 'comment_created':
            if (event.user_id !== userId && event.task_id) {
              // Get task title for context
              message = `コメントが追加されました`
              link = `/tasks/${event.task_id}`
            }
            break
          default:
            return null
        }

        if (!message) return null

        return {
          id: event.id,
          type,
          message,
          link,
          created_at: event.created_at,
          read: false, // MVP: all notifications are unread
        }
      })
      .filter((n): n is NonNullable<typeof n> => n !== null)
      .slice(0, 20) // Limit to 20 most recent

    if (unreadOnly) {
      return NextResponse.json({ notifications: notifications.filter(n => !n.read) })
    }

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/notifications - Mark notification as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { notification_id } = body

    // MVP: We don't have a notifications table yet, so we'll just return success
    // In the future, we'd update a notifications table here
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
