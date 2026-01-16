import { NextRequest, NextResponse } from 'next/server'
import { getNextWeekKey, getWeekKey } from '@/lib/utils/week'

// GET /api/cron/weekly-generate - Weekly task generation (called by Vercel Cron)
// This endpoint is called every Sunday at 18:00 UTC
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentWeekKey = getWeekKey()
    const nextWeekKey = getNextWeekKey(currentWeekKey)

    // Call the week generation API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL}`
      : 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/weeks/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        week_key: nextWeekKey,
        created_by: '00000000-0000-0000-0000-000000000001', // System user
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error generating week:', error)
      return NextResponse.json({ error: 'Failed to generate week' }, { status: 500 })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      week_key: nextWeekKey,
      tasks_created: data.tasks_created,
    })
  } catch (error) {
    console.error('Error in weekly generation cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
