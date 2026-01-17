import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// GET /api/users - Get all users
export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, role, default_language, created_at, updated_at')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching users:', error)
      // Fallback to mock data
      return NextResponse.json({
        users: [
          { id: "1", name: "Kaori", role: "admin", default_language: "ja", created_at: "", updated_at: "" },
          { id: "2", name: "Mai", role: "coadmin", default_language: "ja", created_at: "", updated_at: "" },
          { id: "3", name: "Maxime", role: "worker", default_language: "fr", created_at: "", updated_at: "" },
        ]
      })
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error('Error in GET /api/users:', error)
    // Fallback to mock data
    return NextResponse.json({
      users: [
        { id: "1", name: "Kaori", role: "admin", default_language: "ja", created_at: "", updated_at: "" },
        { id: "2", name: "Mai", role: "coadmin", default_language: "ja", created_at: "", updated_at: "" },
        { id: "3", name: "Maxime", role: "worker", default_language: "fr", created_at: "", updated_at: "" },
      ]
    })
  }
}
