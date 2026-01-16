import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { translateJaToFr, translateFrToJa } from '@/lib/gemini/translator'
import { logEvent } from '@/lib/events/logger'

// POST /api/translate/retry - Retry translation for a task, checklist item, or comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, id } = body // type: 'task' | 'checklist' | 'comment', id: UUID

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 })
    }

    try {
      if (type === 'task') {
        const { data: task, error } = await supabase
          .from('tasks')
          .select('title_ja, body_ja, title_fr, body_fr')
          .eq('id', id)
          .single()

        if (error || !task) {
          return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        let title_fr: string | null = null
        let body_fr: string | null = null

        try {
          if (task.title_ja) {
            title_fr = await translateJaToFr(task.title_ja)
            await logEvent('translation_succeeded', { type: 'task', field: 'title_ja', task_id: id }, null, id)
          }
          if (task.body_ja) {
            body_fr = await translateJaToFr(task.body_ja)
            await logEvent('translation_succeeded', { type: 'task', field: 'body_ja', task_id: id }, null, id)
          }
        } catch (error) {
          console.error('Translation failed:', error)
          await logEvent('translation_failed', { type: 'task', task_id: id, error: String(error) }, null, id)
          return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
        }

        const { data: updatedTask, error: updateError } = await supabase
          .from('tasks')
          .update({
            title_fr,
            body_fr,
            translated_at: new Date().toISOString(),
            needs_retranslate: false,
          })
          .eq('id', id)
          .select()
          .single()

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ task: updatedTask })
      } else if (type === 'checklist') {
        const { data: item, error } = await supabase
          .from('checklist_items')
          .select('text_ja, text_fr, task_id')
          .eq('id', id)
          .single()

        if (error || !item) {
          return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
        }

        let text_fr: string | null = null

        try {
          if (item.text_ja) {
            text_fr = await translateJaToFr(item.text_ja)
            await logEvent('translation_succeeded', { type: 'checklist', checklist_item_id: id }, null, item.task_id, id)
          }
        } catch (error) {
          console.error('Translation failed:', error)
          await logEvent('translation_failed', { type: 'checklist', checklist_item_id: id, error: String(error) }, null, item.task_id, id)
          return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
        }

        const { data: updatedItem, error: updateError } = await supabase
          .from('checklist_items')
          .update({
            text_fr,
            translated_at: new Date().toISOString(),
            needs_retranslate: false,
          })
          .eq('id', id)
          .select()
          .single()

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ item: updatedItem })
      } else if (type === 'comment') {
        const { data: comment, error } = await supabase
          .from('comments')
          .select('body_ja, body_fr, task_id')
          .eq('id', id)
          .single()

        if (error || !comment) {
          return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
        }

        let body_fr: string | null = null

        try {
          if (comment.body_ja) {
            body_fr = await translateJaToFr(comment.body_ja)
            await logEvent('translation_succeeded', { type: 'comment', comment_id: id }, null, comment.task_id)
          }
        } catch (error) {
          console.error('Translation failed:', error)
          await logEvent('translation_failed', { type: 'comment', comment_id: id, error: String(error) }, null, comment.task_id)
          return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
        }

        const { data: updatedComment, error: updateError } = await supabase
          .from('comments')
          .update({
            body_fr,
            translated_at: new Date().toISOString(),
            needs_retranslate: false,
          })
          .eq('id', id)
          .select()
          .single()

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ comment: updatedComment })
      } else {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
      }
    } catch (error) {
      console.error('Error in translation retry:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in POST /api/translate/retry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
