"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Calendar, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import DashboardLayout from "@/components/layout/dashboard-layout"

interface Week {
  id: string
  week_key: string
  business_date_default: string
  business_date_actual: string | null
  created_at: string
}

export default function SchedulePage() {
  const [weeks, setWeeks] = useState<Week[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingWeek, setEditingWeek] = useState<string | null>(null)
  const [editDate, setEditDate] = useState("")

  useEffect(() => {
    loadWeeks()
  }, [])

  const loadWeeks = async () => {
    try {
      const res = await fetch("/api/weeks?limit=12")
      if (res.ok) {
        const data = await res.json()
        // Fetch full week data including IDs
        const weeksWithIds: Week[] = []
        for (const weekData of data.weeks || []) {
          // Try to find week by week_key to get ID
          const weekRes = await fetch(`/api/weeks?week_key=${weekData.week_key}`)
          if (weekRes.ok) {
            const weekDataFull = await weekRes.json()
            if (weekDataFull.weeks && weekDataFull.weeks.length > 0) {
              weeksWithIds.push(weekDataFull.weeks[0])
            } else {
              // Create week if it doesn't exist
              const createRes = await fetch("/api/weeks/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  week_key: weekData.week_key,
                  created_by: "00000000-0000-0000-0000-000000000001", // Default admin
                }),
              })
              if (createRes.ok) {
                const created = await createRes.json()
                weeksWithIds.push({
                  id: created.week_id,
                  week_key: weekData.week_key,
                  business_date_default: weekData.business_date_default,
                  business_date_actual: null,
                  created_at: new Date().toISOString(),
                })
              }
            }
          }
        }
        setWeeks(weeksWithIds)
      }
    } catch (error) {
      console.error("Error loading weeks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditWeek = (week: Week) => {
    setEditingWeek(week.id)
    setEditDate(week.business_date_actual || week.business_date_default)
  }

  const handleSaveWeek = async (weekId: string) => {
    try {
      const res = await fetch(`/api/weeks/${weekId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_date_actual: editDate || null,
          updated_by: "00000000-0000-0000-0000-000000000001", // TODO: Get from session
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setWeeks(weeks.map(w => w.id === weekId ? data.week : w))
        setEditingWeek(null)
        setEditDate("")
        alert("営業日を更新しました。未完了タスクの期限も再計算されました。")
      }
    } catch (error) {
      console.error("Error updating week:", error)
      alert("更新に失敗しました")
    }
  }

  const handleCancelEdit = () => {
    setEditingWeek(null)
    setEditDate("")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">営業日管理</h1>
          <p className="text-sm sm:text-base text-muted-foreground text-pretty mt-1">
            週ごとの営業日例外を設定します
          </p>
        </div>

        {/* Weeks List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-balance flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              営業日一覧
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-pretty">
              デフォルトは木曜です。例外日を設定できます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-base sm:text-sm text-muted-foreground text-pretty">
                読み込み中...
              </div>
            ) : weeks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-base sm:text-sm text-pretty">営業日が登録されていません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {weeks.map((week, index) => {
                  const defaultDate = new Date(week.business_date_default + 'T00:00:00')
                  const actualDate = week.business_date_actual
                    ? new Date(week.business_date_actual + 'T00:00:00')
                    : null
                  const isException = actualDate && actualDate.getTime() !== defaultDate.getTime()

                  return (
                    <motion.div
                      key={week.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.05 }}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-base sm:text-lg text-balance">
                            {week.week_key}
                          </span>
                          {isException && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                              例外設定
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground text-pretty">
                          <span>デフォルト: {defaultDate.toLocaleDateString("ja-JP", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                          {actualDate && (
                            <span className="ml-2">
                              → 実際: {actualDate.toLocaleDateString("ja-JP", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {editingWeek === week.id ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="date"
                              value={editDate.split('T')[0]}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="h-10 w-40 text-sm"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveWeek(week.id)}
                              className="h-10"
                            >
                              <Save className="mr-1 h-4 w-4" />
                              保存
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="h-10"
                            >
                              <X className="mr-1 h-4 w-4" />
                              キャンセル
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditWeek(week)}
                            className="h-10 text-sm"
                          >
                            編集
                          </Button>
                        )}
                      </div>
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
