import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { getWeekKey, getDefaultBusinessDay, getNextWeekKey } from '@/lib/utils/week'

// GET /api/weeks - Get upcoming business dates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '12', 10) // Default: 12 weeks ahead
    const requestedWeekKey = searchParams.get('week_key')

    // If week_key is provided, return that specific week
    if (requestedWeekKey) {
      const { data: week, error } = await supabase
        .from('weeks')
        .select('*')
        .eq('week_key', requestedWeekKey)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ weeks: week ? [week] : [] })
    }

    // Get current week key
    const currentWeekKey = getWeekKey()
    
    // Fetch weeks from database (current and future)
    const { data: weeks, error } = await supabase
      .from('weeks')
      .select('*')
      .gte('week_key', currentWeekKey)
      .order('week_key', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching weeks:', error)
      // Fallback: generate weeks on the fly
      const generatedWeeks = []
      let fallbackWeekKey = currentWeekKey
      for (let i = 0; i < limit; i++) {
        const businessDate = getDefaultBusinessDay(fallbackWeekKey)
        generatedWeeks.push({
          id: `temp-${fallbackWeekKey}`,
          week_key: fallbackWeekKey,
          business_date_default: businessDate.toISOString().split('T')[0],
          business_date_actual: null,
          created_at: new Date().toISOString(),
        })
        fallbackWeekKey = getNextWeekKey(fallbackWeekKey)
      }
      return NextResponse.json({ weeks: generatedWeeks })
    }

    // If we have fewer weeks than requested, generate the rest
    const existingWeekKeys = new Set(weeks?.map(w => w.week_key) || [])
    const allWeeks = [...(weeks || [])]
    let loopWeekKey = currentWeekKey
    
    for (let i = 0; i < limit; i++) {
      if (!existingWeekKeys.has(loopWeekKey)) {
        const businessDate = getDefaultBusinessDay(loopWeekKey)
        allWeeks.push({
          id: `temp-${loopWeekKey}`,
          week_key: loopWeekKey,
          business_date_default: businessDate.toISOString().split('T')[0],
          business_date_actual: null,
          created_at: new Date().toISOString(),
        })
      }
      loopWeekKey = getNextWeekKey(loopWeekKey)
    }

    // Sort and limit
    allWeeks.sort((a, b) => a.week_key.localeCompare(b.week_key))
    const limitedWeeks = allWeeks.slice(0, limit)

    return NextResponse.json({ weeks: limitedWeeks })
  } catch (error) {
    console.error('Error in GET /api/weeks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weeks' },
      { status: 500 }
    )
  }
}
