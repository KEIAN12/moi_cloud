import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { translateJaToFr } from '@/lib/gemini/translator'
import { logEvent } from '@/lib/events/logger'

// PATCH /api/checklist/[id] - Update a checklist item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { done_by, ...updates } = body

    // If Japanese text is updated, retranslate
    if (updates.text_ja) {
      try {
        updates.text_fr = await translateJaToFr(updates.text_ja)
        updates.translated_at = new Date().toISOString()
        updates.needs_retranslate = false
      } catch (error) {
        console.error('Translation failed:', error)
        updates.needs_retranslate = true
      }
    }

    // Handle check/uncheck
    if (updates.is_done !== undefined) {
      if (updates.is_done) {
        updates.done_at = new Date().toISOString()
        updates.done_by = done_by || null
        await logEvent('checklist_checked', { checklist_item_id: id }, done_by, null, id)
      } else {
        updates.done_at = null
        updates.done_by = null
        await logEvent('checklist_unchecked', { checklist_item_id: id }, done_by, null, id)
      }
    }

    updates.updated_at = new Date().toISOString()

    const { data: item, error } = await supabase
      .from('checklist_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (updates.text_ja || updates.assignee_user_id) {
      await logEvent('checklist_updated', { checklist_item_id: id, updates }, done_by, null, id)
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error updating checklist item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
