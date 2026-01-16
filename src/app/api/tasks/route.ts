import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { translateJaToFr, translateFrToJa } from '@/lib/gemini/translator'
import { logEvent } from '@/lib/events/logger'
import type { Task, ChecklistItem } from '@/lib/supabase/types'

// GET /api/tasks - Get tasks with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const weekId = searchParams.get('week_id')
    const status = searchParams.get('status')
    const assigneeId = searchParams.get('assignee_id')
    const tag = searchParams.get('tag')

    let query = supabase.from('tasks').select('*')

    if (weekId) {
      query = query.eq('week_id', weekId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (tag) {
      query = query.eq('tag', tag)
    }

    query = query.order('due_at', { ascending: true })

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter by assignee if needed (check checklist items)
    if (assigneeId) {
      const { data: checklistData } = await supabase
        .from('checklist_items')
        .select('task_id')
        .eq('assignee_user_id', assigneeId)

      const taskIds = new Set(checklistData?.map((item) => item.task_id) || [])
      const filtered = (data || []).filter((task) => taskIds.has(task.id))

      return NextResponse.json({ tasks: filtered })
    }

    return NextResponse.json({ tasks: data || [] })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      week_id,
      title_ja,
      body_ja,
      due_at,
      priority = 'MEDIUM',
      tag,
      created_by,
    } = body

    if (!week_id || !title_ja || !due_at || !created_by) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Translate to French
    let title_fr: string | null = null
    let body_fr: string | null = null

    try {
      title_fr = await translateJaToFr(title_ja)
      if (body_ja) {
        body_fr = await translateJaToFr(body_ja)
      }
    } catch (error) {
      console.error('Translation failed:', error)
      // Continue without translation
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        week_id,
        title_ja,
        title_fr,
        body_ja: body_ja || null,
        body_fr,
        due_at,
        priority,
        tag: tag || null,
        created_by,
        translated_at: title_fr ? new Date().toISOString() : null,
        needs_retranslate: !title_fr,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logEvent('task_created', { task_id: task.id, title_ja }, created_by, task.id)

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
