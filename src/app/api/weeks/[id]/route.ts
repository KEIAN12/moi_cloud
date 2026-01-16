import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { parseRelativeDueRule } from '@/lib/utils/week'
import { logEvent } from '@/lib/events/logger'

// GET /api/weeks/[id] - Get a single week
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: week, error } = await supabase
      .from('weeks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!week) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 })
    }

    return NextResponse.json({ week })
  } catch (error) {
    console.error('Error fetching week:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/weeks/[id] - Update week (mainly for business_date_actual)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { business_date_actual, updated_by } = body

    // Get current week data
    const { data: currentWeek, error: fetchError } = await supabase
      .from('weeks')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentWeek) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 })
    }

    // Update business_date_actual
    const { data: week, error: updateError } = await supabase
      .from('weeks')
      .update({
        business_date_actual: business_date_actual || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // If business date changed, recalculate due dates for incomplete tasks
    if (business_date_actual && business_date_actual !== currentWeek.business_date_actual) {
      const businessDate = new Date(business_date_actual + 'T00:00:00')

      // Get all incomplete tasks for this week
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, week_id')
        .eq('week_id', id)
        .in('status', ['TODO', 'IN_PROGRESS'])

      if (!tasksError && tasks) {
        // Get template tasks to find relative_due_rule
        const { data: template } = await supabase
          .from('templates')
          .select('id')
          .eq('is_active', true)
          .single()

        if (template) {
          const { data: templateTasks } = await supabase
            .from('template_tasks')
            .select('id, title_ja, relative_due_rule')
            .eq('template_id', template.id)

          // Update each task's due_at based on template rule
          for (const task of tasks) {
            // Try to match task by title_ja (simple approach)
            // In production, you might want to store template_task_id in tasks table
            const { data: taskData } = await supabase
              .from('tasks')
              .select('title_ja')
              .eq('id', task.id)
              .single()

            if (taskData) {
              const templateTask = templateTasks?.find(t => t.title_ja === taskData.title_ja)
              if (templateTask) {
                try {
                  const newDueAt = parseRelativeDueRule(templateTask.relative_due_rule, businessDate)
                  
                  // Only update if due_at hasn't been manually changed
                  // (In production, you might want to track if due_at was manually set)
                  await supabase
                    .from('tasks')
                    .update({ due_at: newDueAt.toISOString() })
                    .eq('id', task.id)

                  // Also update checklist items
                  const { data: checklistItems } = await supabase
                    .from('checklist_items')
                    .select('id')
                    .eq('task_id', task.id)
                    .eq('is_done', false)

                  if (checklistItems) {
                    for (const item of checklistItems) {
                      await supabase
                        .from('checklist_items')
                        .update({ due_at: newDueAt.toISOString() })
                        .eq('id', item.id)
                    }
                  }
                } catch (error) {
                  console.error(`Error updating due date for task ${task.id}:`, error)
                }
              }
            }
          }
        }
      }
    }

    await logEvent(
      'schedule_exception_changed',
      { week_id: id, business_date_actual, week_key: week.week_key },
      updated_by || null
    )

    return NextResponse.json({ week })
  } catch (error) {
    console.error('Error updating week:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
