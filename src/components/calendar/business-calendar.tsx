"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface BusinessDate {
  week_key: string
  business_date_default: string
  business_date_actual: string | null
}

interface BusinessCalendarProps {
  businessDates: BusinessDate[]
}

export function BusinessCalendar({ businessDates }: BusinessCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Get the actual business date (use actual if set, otherwise default)
  const getBusinessDate = (week: BusinessDate): Date => {
    const dateStr = week.business_date_actual || week.business_date_default
    return new Date(dateStr + 'T00:00:00')
  }

  // Create a map of business dates for quick lookup
  const businessDatesMap = useMemo(() => {
    const map = new Map<string, BusinessDate>()
    businessDates.forEach(week => {
      const date = getBusinessDate(week)
      const key = date.toISOString().split('T')[0]
      map.set(key, week)
    })
    return map
  }, [businessDates])

  // Get next business date
  const nextBusinessDate = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (const week of businessDates) {
      const date = getBusinessDate(week)
      if (date >= today) {
        return date
      }
    }
    return null
  }, [businessDates])

  // Calendar logic
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  const days: (Date | null)[] = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day))
  }

  const monthNames = [
    "1月", "2月", "3月", "4月", "5月", "6月",
    "7月", "8月", "9月", "10月", "11月", "12月"
  ]

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"]

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  const isToday = (date: Date | null): boolean => {
    if (!date) return false
    const today = new Date()
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  }

  const isBusinessDate = (date: Date | null): boolean => {
    if (!date) return false
    const key = date.toISOString().split('T')[0]
    return businessDatesMap.has(key)
  }

  const isPast = (date: Date | null): boolean => {
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl text-balance">営業カレンダー</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
              aria-label="前の月"
              className="h-9 w-9 sm:h-8 sm:w-8"
            >
              <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToToday}
              className="h-9 px-3 sm:h-8 sm:px-2 text-sm"
            >
              今日
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              aria-label="次の月"
              className="h-9 w-9 sm:h-8 sm:w-8"
            >
              <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
        <p className="text-base sm:text-lg font-semibold text-center mt-2 text-balance">
          {year}年 {monthNames[month]}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs sm:text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const dateKey = date.toISOString().split('T')[0]
            const businessDate = businessDatesMap.get(dateKey)
            const isBusiness = isBusinessDate(date)
            const isTodayDate = isToday(date)
            const isPastDate = isPast(date)

            return (
              <div
                key={dateKey}
                className={cn(
                  "aspect-square flex items-center justify-center rounded-md text-sm sm:text-base font-medium transition-colors",
                  isTodayDate && "bg-primary text-primary-foreground font-bold",
                  isBusiness && !isTodayDate && !isPastDate && "bg-primary/20 text-primary font-semibold",
                  isBusiness && isPastDate && "bg-muted/50 text-muted-foreground",
                  !isBusiness && !isTodayDate && "text-muted-foreground hover:bg-muted/50",
                  !isBusiness && !isTodayDate && isPastDate && "opacity-50"
                )}
              >
                {date.getDate()}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex items-center gap-4 text-xs sm:text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary"></div>
              <span className="text-pretty">今日</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary/20"></div>
              <span className="text-pretty">営業日</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted/50"></div>
              <span className="text-pretty">過去の営業日</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
