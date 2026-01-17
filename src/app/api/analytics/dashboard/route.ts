import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// GET /api/analytics/dashboard - Get analytics data for dashboard
export async function GET() {
  try {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 1. Overdue tasks
    const { data: overdueTasks } = await supabase
      .from('tasks')
      .select('id, title_ja, due_at, status, tag')
      .lt('due_at', now.toISOString())
      .in('status', ['TODO', 'IN_PROGRESS'])
      .order('due_at', { ascending: true })

    // 2. Overdue checklist items
    const { data: overdueChecklist } = await supabase
      .from('checklist_items')
      .select('id, text_ja, due_at, is_done, task_id, tasks(title_ja)')
      .lt('due_at', now.toISOString())
      .eq('is_done', false)
      .order('due_at', { ascending: true })

    // 3. Frequently missed posts (tasks with tag "Promotion" that are often overdue)
    const { data: promotionTasks } = await supabase
      .from('tasks')
      .select('id, title_ja, due_at, status, tag')
      .eq('tag', 'Promotion')
      .lt('due_at', now.toISOString())
      .in('status', ['TODO', 'IN_PROGRESS'])

    // 4. Unused checklist items (always unchecked)
    const { data: allChecklistItems } = await supabase
      .from('checklist_items')
      .select('id, text_ja, is_done, task_id, tasks(title_ja)')
      .order('created_at', { ascending: false })
      .limit(100)

    // Count unchecked items
    const unusedItems = (allChecklistItems || [])
      .filter(item => !item.is_done)
      .slice(0, 10)

    // 5. Maxime's work concentration (checklist items assigned to worker role)
    const { data: maximeUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'worker')
      .single()

    let maximeWorkConcentration = null
    if (maximeUser) {
      const { data: maximeItems, error: maximeError } = await supabase
        .from('checklist_items')
        .select('id, due_at, is_done')
        .eq('assignee_user_id', maximeUser.id)
        .gte('due_at', oneWeekAgo.toISOString())
        .lte('due_at', now.toISOString())

      if (!maximeError && maximeItems) {
        // Count items due today vs items due in the future
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const dueToday = maximeItems.filter(item => {
          const due = new Date(item.due_at)
          return due >= today && due < tomorrow
        }).length

        const total = maximeItems.length
        maximeWorkConcentration = {
          due_today: dueToday,
          total: total,
          percentage: total > 0 ? Math.round((dueToday / total) * 100) : 0,
        }
      }
    }

    return NextResponse.json({
      overdue_tasks: overdueTasks || [],
      overdue_checklist: overdueChecklist || [],
      frequently_missed_posts: promotionTasks || [],
      unused_checklist_items: unusedItems,
      maxime_work_concentration: maximeWorkConcentration,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
