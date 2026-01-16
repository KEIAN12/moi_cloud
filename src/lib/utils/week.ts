/**
 * Get week key from date (e.g., "2026-W04")
 */
export function getWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`
}

/**
 * Get the default business day (Thursday) for a given week
 */
export function getDefaultBusinessDay(weekKey: string): Date {
  const [year, week] = weekKey.split('-W').map(Number)
  const jan4 = new Date(year, 0, 4)
  const jan4Day = jan4.getDay() || 7
  const week1Start = new Date(year, 0, 4 - jan4Day + 1)
  const targetWeekStart = new Date(week1Start)
  targetWeekStart.setDate(week1Start.getDate() + (week - 1) * 7)
  
  // Thursday is day 4 (0-indexed, but we use 1-7 where Monday=1)
  const thursday = new Date(targetWeekStart)
  thursday.setDate(targetWeekStart.getDate() + 3) // Monday + 3 = Thursday
  
  return thursday
}

/**
 * Parse relative due rule (e.g., "-4 days 20:00")
 */
export function parseRelativeDueRule(
  rule: string,
  businessDate: Date
): Date {
  const match = rule.match(/^([+-]?\d+)\s*(day|days)\s+(\d{1,2}):(\d{2})$/)
  if (!match) {
    throw new Error(`Invalid rule format: ${rule}`)
  }

  const [, daysStr, , hoursStr, minutesStr] = match
  const days = parseInt(daysStr, 10)
  const hours = parseInt(hoursStr, 10)
  const minutes = parseInt(minutesStr, 10)

  const result = new Date(businessDate)
  result.setDate(result.getDate() + days)
  result.setHours(hours, minutes, 0, 0)

  return result
}

/**
 * Get next week key
 */
export function getNextWeekKey(currentWeekKey?: string): string {
  if (!currentWeekKey) {
    return getWeekKey()
  }

  const [year, week] = currentWeekKey.split('-W').map(Number)
  const nextWeek = week + 1
  const weeksInYear = 52 // Approximate

  if (nextWeek > weeksInYear) {
    return `${year + 1}-W01`
  }

  return `${year}-W${nextWeek.toString().padStart(2, '0')}`
}
