import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { translateJaToFr } from '@/lib/gemini/translator'
import { logEvent } from '@/lib/events/logger'

// POST /api/checklist - Create a checklist item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { task_id, text_ja, assignee_user_id, due_at, sort_order } = body

    if (!task_id || !text_ja || !assignee_user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Translate to French
    let text_fr: string | null = null
    try {
      text_fr = await translateJaToFr(text_ja)
    } catch (error) {
      console.error('Translation failed:', error)
    }

    const { data: item, error } = await supabase
      .from('checklist_items')
      .insert({
        task_id,
        text_ja,
        text_fr,
        assignee_user_id,
        due_at: due_at || null,
        sort_order: sort_order || 0,
        translated_at: text_fr ? new Date().toISOString() : null,
        needs_retranslate: !text_fr,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logEvent('checklist_created', { checklist_item_id: item.id, text_ja }, null, task_id, item.id)

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating checklist item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
