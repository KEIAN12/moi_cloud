import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// GET /api/checklist/my - Get checklist items assigned to a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    // Get checklist items assigned to this user
    const { data: items, error } = await supabase
      .from('checklist_items')
      .select(`
        *,
        task:tasks(
          id,
          title_ja,
          title_fr,
          due_at
        )
      `)
      .eq('assignee_user_id', userId)
      .order('due_at', { ascending: true, nullsFirst: false })
      .order('sort_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    interface TaskInfo {
      id: string
      title_ja: string
      title_fr: string | null
      due_at: string
    }

    interface ChecklistItemWithTask {
      id: string
      task_id: string
      text_ja: string
      text_fr: string | null
      is_done: boolean
      due_at: string | null
      task: TaskInfo
    }

    interface GroupedTask {
      task: TaskInfo
      items: ChecklistItemWithTask[]
    }

    // Group by task
    const grouped = (items || []).reduce((acc: Record<string, GroupedTask>, item: ChecklistItemWithTask) => {
      const taskId = item.task_id
      if (!acc[taskId]) {
        acc[taskId] = {
          task: item.task,
          items: [],
        }
      }
      acc[taskId].items.push(item)
      return acc
    }, {})

    const result = (Object.values(grouped) as GroupedTask[]).map((group) => ({
      task_id: group.task.id,
      task_title: group.task.title_fr || group.task.title_ja,
      due_at: group.task.due_at,
      items: group.items.map((item) => ({
        id: item.id,
        text: item.text_fr || item.text_ja,
        is_done: item.is_done,
        due_at: item.due_at,
      })),
    }))

    return NextResponse.json({ tasks: result })
  } catch (error) {
    console.error('Error fetching my checklist items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
