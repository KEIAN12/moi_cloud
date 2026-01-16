"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Calendar as CalendarIcon, Edit2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BusinessCalendar } from "@/components/calendar/business-calendar"
import DashboardLayout from "@/components/layout/dashboard-layout"

interface BusinessDate {
  week_key: string
  business_date_default: string
  business_date_actual: string | null
}

export default function SchedulePage() {
    const [businessDates, setBusinessDates] = useState<BusinessDate[]>([])
    const [nextBusinessDate, setNextBusinessDate] = useState<Date | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadBusinessDates()
    }, [])

    const loadBusinessDates = async () => {
        try {
            const res = await fetch("/api/weeks?limit=12")
            if (res.ok) {
                const data = await res.json()
                setBusinessDates(data.weeks || [])
                
                // Calculate next business date
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                
                for (const week of data.weeks || []) {
                    const dateStr = week.business_date_actual || week.business_date_default
                    const date = new Date(dateStr + 'T00:00:00')
                    if (date >= today) {
                        setNextBusinessDate(date)
                        break
                    }
                }
            }
        } catch (error) {
            console.error("Error loading business dates:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 sm:space-y-8">
                {/* Header */}
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">スケジュール</h1>
                        <p className="text-sm sm:text-base text-muted-foreground text-pretty mt-1">
                            営業日とスケジュール管理
                        </p>
                    </div>
                </div>

                {/* Next Business Date */}
                {nextBusinessDate && (
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-lg sm:text-xl text-balance flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                次回営業日
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="text-2xl sm:text-3xl font-bold tabular-nums">
                                    {nextBusinessDate.toLocaleDateString("ja-JP", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        weekday: "long",
                                    })}
                                </div>
                                {(() => {
                                    const today = new Date()
                                    today.setHours(0, 0, 0, 0)
                                    const diffTime = nextBusinessDate.getTime() - today.getTime()
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                                    
                                    if (diffDays === 0) {
                                        return <p className="text-sm sm:text-base text-muted-foreground text-pretty">今日が営業日です</p>
                                    } else if (diffDays === 1) {
                                        return <p className="text-sm sm:text-base text-muted-foreground text-pretty">明日が営業日です</p>
                                    } else {
                                        return <p className="text-sm sm:text-base text-muted-foreground text-pretty">あと<span className="tabular-nums font-semibold">{diffDays}</span>日</p>
                                    }
                                })()}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Business Calendar */}
                {businessDates.length > 0 && (
                    <BusinessCalendar businessDates={businessDates} />
                )}

                {/* Upcoming Weeks */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl text-balance">今後の営業日</CardTitle>
                        <CardDescription className="text-sm sm:text-base text-pretty">今後12週間の営業日一覧</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8 text-base sm:text-sm text-muted-foreground text-pretty">読み込み中...</div>
                        ) : businessDates.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="text-base sm:text-sm text-pretty">営業日データがありません</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {businessDates.map((week, index) => {
                                    const dateStr = week.business_date_actual || week.business_date_default
                                    const date = new Date(dateStr + 'T00:00:00')
                                    const today = new Date()
                                    today.setHours(0, 0, 0, 0)
                                    const isPast = date < today
                                    const isToday = date.toDateString() === today.toDateString()
                                    
                                    return (
                                        <motion.div
                                            key={week.week_key}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.15, delay: index * 0.05 }}
                                            className={`flex items-center justify-between rounded-lg border p-4 ${isToday ? "bg-primary/10 border-primary" : isPast ? "opacity-60" : ""}`}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-semibold text-base sm:text-lg text-balance">{week.week_key}</span>
                                                    {isToday && (
                                                        <Badge variant="default" className="text-xs">今日</Badge>
                                                    )}
                                                    {week.business_date_actual && (
                                                        <Badge variant="secondary" className="text-xs">例外日</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm sm:text-base text-muted-foreground text-pretty tabular-nums">
                                                    {date.toLocaleDateString("ja-JP", {
                                                        year: "numeric",
                                                        month: "long",
                                                        day: "numeric",
                                                        weekday: "long",
                                                    })}
                                                </p>
                                            </div>
                                            <Button variant="outline" size="icon" aria-label="編集" className="h-10 w-10">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
