import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { translateJaToFr } from '@/lib/gemini/translator'
import { logEvent } from '@/lib/events/logger'

// GET /api/tasks/[id] - Get a single task with checklist items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID format (but allow mock task IDs that start with all zeros)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid task ID format' },
        { status: 400 }
      )
    }

    // If it's a mock task ID, return 404 (should be handled on frontend)
    if (id.startsWith("00000000-0000-0000-0000-")) {
      return NextResponse.json(
        { error: 'Task not found (mock task)' },
        { status: 404 }
      )
    }

    // Try to select all columns, but handle case where assignee_user_id might not exist yet
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (taskError) {
      console.error('Error fetching task:', taskError)
      // If column doesn't exist error, try without assignee_user_id
      if (taskError.message?.includes('assignee_user_id') || taskError.message?.includes('column')) {
        const { data: taskWithoutAssignee, error: retryError } = await supabase
          .from('tasks')
          .select('id, week_id, title_ja, title_fr, body_ja, body_fr, due_at, priority, status, tag, created_by, updated_by, created_at, updated_at, translated_at, needs_retranslate')
          .eq('id', id)
          .single()
        
        if (retryError || !taskWithoutAssignee) {
          return NextResponse.json(
            { error: retryError?.message || 'Task not found' },
            { status: retryError ? 500 : 404 }
          )
        }
        
        // Add assignee_user_id as null if column doesn't exist
        const task = { ...taskWithoutAssignee, assignee_user_id: null }
        
        const { data: checklistItems } = await supabase
          .from('checklist_items')
          .select('*')
          .eq('task_id', id)
          .order('sort_order', { ascending: true })

        const { data: comments } = await supabase
          .from('comments')
          .select('*')
          .eq('task_id', id)
          .order('created_at', { ascending: true })

        return NextResponse.json({
          task,
          checklist_items: checklistItems || [],
          comments: comments || [],
        })
      }
      
      return NextResponse.json(
        { error: taskError.message || 'Task not found' },
        { status: 500 }
      )
    }

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Ensure assignee_user_id exists (might be undefined if column doesn't exist)
    if (task.assignee_user_id === undefined) {
      task.assignee_user_id = null
    }

    const { data: checklistItems, error: checklistError } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('task_id', id)
      .order('sort_order', { ascending: true })

    if (checklistError) {
      console.error('Error fetching checklist items:', checklistError)
      // Continue even if checklist fails
    }

    const { data: comments } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      task,
      checklist_items: checklistItems || [],
      comments: comments || [],
    })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { updated_by, ...updates } = body

    // If Japanese text is updated, retranslate
    if (updates.title_ja || updates.body_ja) {
      const { data: currentTask } = await supabase
        .from('tasks')
        .select('title_ja, body_ja')
        .eq('id', id)
        .single()

      const title_ja = updates.title_ja || currentTask?.title_ja
      const body_ja = updates.body_ja || currentTask?.body_ja

      try {
        if (updates.title_ja) {
          updates.title_fr = await translateJaToFr(title_ja)
        }
        if (updates.body_ja) {
          updates.body_fr = await translateJaToFr(body_ja)
        }
        updates.translated_at = new Date().toISOString()
        updates.needs_retranslate = false
      } catch (error) {
        console.error('Translation failed:', error)
        updates.needs_retranslate = true
      }
    }

    updates.updated_at = new Date().toISOString()
    if (updated_by) {
      updates.updated_by = updated_by
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logEvent('task_updated', { task_id: id, updates }, updated_by, id)

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const deleted_by = searchParams.get('deleted_by')

    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logEvent('task_deleted', { task_id: id }, deleted_by || null, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
