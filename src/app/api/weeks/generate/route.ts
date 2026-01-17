import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { translateJaToFr } from '@/lib/gemini/translator'
import { logEvent } from '@/lib/events/logger'
import { getDefaultBusinessDay, parseRelativeDueRule } from '@/lib/utils/week'

// POST /api/weeks/generate - Generate tasks from template for a week
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { week_key, created_by } = body

    if (!week_key || !created_by) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if week already exists
    const { data: existingWeek } = await supabase
      .from('weeks')
      .select('id')
      .eq('week_key', week_key)
      .single()

    let weekId: string

    if (existingWeek) {
      weekId = existingWeek.id
    } else {
      // Create week instance
      const businessDate = getDefaultBusinessDay(week_key)
      const { data: week, error: weekError } = await supabase
        .from('weeks')
        .insert({
          week_key,
          business_date_default: businessDate.toISOString().split('T')[0],
          business_date_actual: null,
        })
        .select()
        .single()

      if (weekError) {
        return NextResponse.json({ error: weekError.message }, { status: 500 })
      }

      weekId = week.id
    }

    // Get active template
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('id')
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'No active template found' },
        { status: 404 }
      )
    }

    // Get template tasks
    const { data: templateTasks, error: templateTasksError } = await supabase
      .from('template_tasks')
      .select('*')
      .eq('template_id', template.id)
      .order('sort_order', { ascending: true })

    if (templateTasksError) {
      return NextResponse.json({ error: templateTasksError.message }, { status: 500 })
    }

    if (!templateTasks || templateTasks.length === 0) {
      return NextResponse.json({ error: 'Template has no tasks' }, { status: 404 })
    }

    // Get business date (use actual if set, otherwise default)
    const { data: weekData } = await supabase
      .from('weeks')
      .select('business_date_actual, business_date_default')
      .eq('id', weekId)
      .single()

    const businessDateStr = weekData?.business_date_actual || weekData?.business_date_default
    const businessDate = new Date(businessDateStr + 'T00:00:00')

    // Check existing tasks for this week
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('id, title_ja')
      .eq('week_id', weekId)

    const existingTitles = new Set(existingTasks?.map((t) => t.title_ja) || [])

    interface CreatedTask {
      id: string
      week_id: string
      title_ja: string
      title_fr: string | null
      due_at: string
      status: string
    }
    const createdTasks: CreatedTask[] = []

    // Create tasks from template
    for (const templateTask of templateTasks) {
      // Skip if task already exists (idempotency)
      if (existingTitles.has(templateTask.title_ja)) {
        continue
      }

      const dueAt = parseRelativeDueRule(templateTask.relative_due_rule, businessDate)

      // Translate title
      let title_fr: string | null = null
      try {
        title_fr = await translateJaToFr(templateTask.title_ja)
      } catch (error) {
        console.error('Translation failed:', error)
      }

      // Create task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          week_id: weekId,
          title_ja: templateTask.title_ja,
          title_fr,
          body_ja: templateTask.body_ja || null,
          body_fr: null, // Will be translated if body_ja exists
          due_at: dueAt.toISOString(),
          priority: 'MEDIUM',
          status: 'TODO',
          tag: templateTask.tag || null,
          created_by,
          translated_at: title_fr ? new Date().toISOString() : null,
          needs_retranslate: !title_fr,
        })
        .select()
        .single()

      if (taskError) {
        console.error('Error creating task:', taskError)
        continue
      }

      // Get template checklist items for this task
      const { data: templateChecklistItems } = await supabase
        .from('template_checklist_items')
        .select('*')
        .eq('template_task_id', templateTask.id)
        .order('sort_order', { ascending: true })

      // Create checklist items
      if (templateChecklistItems && templateChecklistItems.length > 0) {
        // Get users by role
        const { data: users } = await supabase.from('users').select('id, role')

        for (const templateItem of templateChecklistItems) {
          // Resolve assignee (role or user_id)
          let assigneeUserId: string | null = null

          if (templateItem.default_assignee_role_or_user.startsWith('role:')) {
            const role = templateItem.default_assignee_role_or_user.replace('role:', '')
            const user = users?.find((u) => u.role === role)
            assigneeUserId = user?.id || null
          } else {
            assigneeUserId = templateItem.default_assignee_role_or_user
          }

          if (!assigneeUserId) {
            continue
          }

          // Translate checklist item
          let text_fr: string | null = null
          try {
            text_fr = await translateJaToFr(templateItem.text_ja)
          } catch (error) {
            console.error('Translation failed:', error)
          }

          await supabase.from('checklist_items').insert({
            task_id: task.id,
            text_ja: templateItem.text_ja,
            text_fr,
            assignee_user_id: assigneeUserId,
            due_at: dueAt.toISOString(),
            sort_order: templateItem.sort_order,
            translated_at: text_fr ? new Date().toISOString() : null,
            needs_retranslate: !text_fr,
          })
        }
      }

      createdTasks.push(task)
      await logEvent('task_created', { task_id: task.id, from_template: true }, created_by, task.id)
    }

    await logEvent('template_generated', { week_key, tasks_created: createdTasks.length }, created_by)

    return NextResponse.json({
      week_id: weekId,
      tasks_created: createdTasks.length,
      tasks: createdTasks,
    })
  } catch (error) {
    console.error('Error generating week:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
