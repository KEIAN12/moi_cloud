import { NextResponse } from 'next/server'

interface SupabaseProject {
  id: string
  ref: string
  organization_id: string
  organization_slug: string
  name: string
  region: string
  status: string
  database?: {
    host: string
    version: string
    postgres_engine: string
    release_channel: string
  }
  created_at: string
}

// GET /api/supabase/projects - Get list of Supabase projects
export async function GET() {
  try {
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN

    if (!accessToken) {
      return NextResponse.json(
        { error: 'SUPABASE_ACCESS_TOKEN environment variable is not set' },
        { status: 500 }
      )
    }

    const response = await fetch('https://api.supabase.com/v1/projects', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Supabase API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Failed to fetch projects: ${response.statusText}` },
        { status: response.status }
      )
    }

    const projects: SupabaseProject[] = await response.json()

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching Supabase projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
