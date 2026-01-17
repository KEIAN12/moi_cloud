import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { translateJaToFr, translateFrToJa } from '@/lib/gemini/translator'
import { logEvent } from '@/lib/events/logger'

// GET /api/tasks/[id]/comments - Get comments for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comments: comments || [] })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tasks/[id]/comments - Create a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { body_ja, body_fr, author_user_id } = body

    if (!author_user_id) {
      return NextResponse.json({ error: 'Missing author_user_id' }, { status: 400 })
    }

    // If both body_ja and body_fr are provided, use them as-is
    // Otherwise, detect language and translate
    let final_body_ja: string
    let final_body_fr: string | null = null

    if (body_ja && body_fr) {
      // Both provided
      final_body_ja = body_ja
      final_body_fr = body_fr
    } else if (body_ja) {
      // Japanese provided, translate to French
      final_body_ja = body_ja
      try {
        final_body_fr = await translateJaToFr(body_ja)
      } catch (error) {
        console.error('Translation failed (JA→FR):', error)
        final_body_fr = null
      }
    } else if (body_fr) {
      // French provided, translate to Japanese
      final_body_fr = body_fr
      try {
        final_body_ja = await translateFrToJa(body_fr)
      } catch (error) {
        console.error('Translation failed (FR→JA):', error)
        return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Missing body_ja or body_fr' }, { status: 400 })
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        task_id: id,
        author_user_id,
        body_ja: final_body_ja,
        body_fr: final_body_fr,
        translated_at: final_body_fr ? new Date().toISOString() : null,
        needs_retranslate: !final_body_fr,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logEvent('comment_created', { comment_id: comment.id, task_id: id }, author_user_id, id)

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
