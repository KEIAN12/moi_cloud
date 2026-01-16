import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// GET /api/glossary/[id] - Get a single glossary term
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: term, error } = await supabase
      .from('glossary_terms')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!term) {
      return NextResponse.json({ error: 'Term not found' }, { status: 404 })
    }

    return NextResponse.json({ term })
  } catch (error) {
    console.error('Error fetching glossary term:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/glossary/[id] - Update a glossary term
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { ja_term, fr_term, note } = body

    if (!ja_term || !fr_term) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: term, error } = await supabase
      .from('glossary_terms')
      .update({
        ja_term,
        fr_term,
        note: note || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ term })
  } catch (error) {
    console.error('Error updating glossary term:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/glossary/[id] - Delete a glossary term
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabase
      .from('glossary_terms')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting glossary term:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
