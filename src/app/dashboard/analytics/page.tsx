"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, Clock, TrendingDown, User, BarChart3 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import DashboardLayout from "@/components/layout/dashboard-layout"

interface AnalyticsData {
  overdue_tasks: Array<{
    id: string
    title_ja: string
    due_at: string
    status: string
    tag: string | null
  }>
  overdue_checklist: Array<{
    id: string
    text_ja: string
    due_at: string
    is_done: boolean
    task_id: string
    tasks: { title_ja: string } | null
  }>
  frequently_missed_posts: Array<{
    id: string
    title_ja: string
    due_at: string
    status: string
    tag: string | null
  }>
  unused_checklist_items: Array<{
    id: string
    text_ja: string
    is_done: boolean
    task_id: string
    tasks: { title_ja: string } | null
  }>
  maxime_work_concentration: {
    due_today: number
    total: number
    percentage: number
  } | null
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics/dashboard")
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance flex items-center gap-2">
            <BarChart3 className="h-8 w-8 sm:h-6 sm:w-6" />
            分析ダッシュボード
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground text-pretty mt-1">
            タスク運用の分析と改善ポイント
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-base sm:text-sm text-muted-foreground text-pretty">
            読み込み中...
          </div>
        ) : analytics ? (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Overdue Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-balance flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  期限超過タスク
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-pretty">
                  {analytics.overdue_tasks.length}件
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.overdue_tasks.slice(0, 5).map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.05 }}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-pretty truncate">{task.title_ja}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {new Date(task.due_at).toLocaleDateString("ja-JP")}
                        </p>
                      </div>
                      {task.tag && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {task.tag}
                        </Badge>
                      )}
                    </motion.div>
                  ))}
                  {analytics.overdue_tasks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4 text-pretty">
                      期限超過タスクはありません
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Frequently Missed Posts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-balance flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-amber-600" />
                  抜けがちな投稿
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-pretty">
                  {analytics.frequently_missed_posts.length}件
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.frequently_missed_posts.slice(0, 5).map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.05 }}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-pretty truncate">{task.title_ja}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {new Date(task.due_at).toLocaleDateString("ja-JP")}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {analytics.frequently_missed_posts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4 text-pretty">
                      問題なし
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Unused Checklist Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-balance flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  未実行チェック項目
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-pretty">
                  {analytics.unused_checklist_items.length}件
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.unused_checklist_items.slice(0, 5).map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.05 }}
                      className="rounded-lg border p-3"
                    >
                      <p className="text-sm font-medium text-pretty">{item.text_ja}</p>
                      {item.tasks && (
                        <p className="text-xs text-muted-foreground mt-1 text-pretty">
                          タスク: {item.tasks.title_ja}
                        </p>
                      )}
                    </motion.div>
                  ))}
                  {analytics.unused_checklist_items.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4 text-pretty">
                      すべて実行済み
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Maxime Work Concentration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-balance flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  マキシム作業の集中度
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-pretty">
                  当日に集中していないか確認
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.maxime_work_concentration ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground text-pretty">今日期限の作業</span>
                      <span className="text-2xl font-bold tabular-nums">
                        {analytics.maxime_work_concentration.due_today}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground text-pretty">今週の総作業数</span>
                      <span className="text-2xl font-bold tabular-nums">
                        {analytics.maxime_work_concentration.total}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-pretty">集中度</span>
                        <span className="text-lg font-bold tabular-nums">
                          {analytics.maxime_work_concentration.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            analytics.maxime_work_concentration.percentage > 50
                              ? 'bg-destructive'
                              : analytics.maxime_work_concentration.percentage > 30
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(analytics.maxime_work_concentration.percentage, 100)}%` }}
                        />
                      </div>
                      {analytics.maxime_work_concentration.percentage > 50 && (
                        <p className="text-xs text-amber-600 text-pretty">
                          警告: 当日に作業が集中しています
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4 text-pretty">
                    データがありません
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-base sm:text-sm text-pretty">データの読み込みに失敗しました</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
