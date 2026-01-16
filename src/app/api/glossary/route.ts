import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// GET /api/glossary - Get all glossary terms
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('glossary_terms')
      .select('*')
      .order('ja_term', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ terms: data || [] })
  } catch (error) {
    console.error('Error fetching glossary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/glossary - Create a glossary term
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ja_term, fr_term, note } = body

    if (!ja_term || !fr_term) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: term, error } = await supabase
      .from('glossary_terms')
      .insert({
        ja_term,
        fr_term,
        note: note || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ term }, { status: 201 })
  } catch (error) {
    console.error('Error creating glossary term:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
