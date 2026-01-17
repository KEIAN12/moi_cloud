"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, Calendar as CalendarIcon, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Task, User as UserType } from "@/lib/supabase/types"
import { getWeekKey } from "@/lib/utils/week"
import { getStatusLabel, getTagLabel } from "@/lib/utils/status"
import type { TaskStatus } from "@/lib/supabase/types"
import { BusinessCalendar } from "@/components/calendar/business-calendar"
import { User } from "lucide-react"

interface BusinessDate {
  week_key: string
  business_date_default: string
  business_date_actual: string | null
}

export default function DashboardPage() {
    const router = useRouter()
    const [tasks, setTasks] = useState<Task[]>([])
    const [allTasks, setAllTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentWeekKey, setCurrentWeekKey] = useState(getWeekKey())
    const [businessDates, setBusinessDates] = useState<BusinessDate[]>([])
    const [nextBusinessDate, setNextBusinessDate] = useState<Date | null>(null)
    const [users, setUsers] = useState<UserType[]>([])
    const [viewMode, setViewMode] = useState<"all" | "my">("all")
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        // Get current user ID from session
        if (typeof window !== "undefined") {
            const userId = sessionStorage.getItem("userId")
            setCurrentUserId(userId)
        }
        loadTasks()
        loadBusinessDates()
        loadUsers()
    }, [currentWeekKey])

    useEffect(() => {
        // Filter tasks based on view mode
        if (viewMode === "my" && currentUserId && users.length > 0) {
            // Find user by session ID (kaori, mai, maxime) and get database ID
            const user = users.find(u => {
                // Try to match by name (case-insensitive)
                const nameLower = u.name.toLowerCase()
                if (currentUserId === "kaori" && nameLower.includes("kaori")) return true
                if (currentUserId === "mai" && nameLower.includes("mai")) return true
                if (currentUserId === "maxime" && nameLower.includes("maxime")) return true
                return false
            })
            
            if (user) {
                setTasks(allTasks.filter(t => t.assignee_user_id === user.id))
            } else {
                // Fallback: try direct ID mapping
                const userIdMap: Record<string, string> = {
                    "kaori": "1",
                    "mai": "2",
                    "maxime": "3",
                }
                const dbUserId = userIdMap[currentUserId] || currentUserId
                setTasks(allTasks.filter(t => t.assignee_user_id === dbUserId))
            }
        } else {
            setTasks(allTasks)
        }
    }, [viewMode, currentUserId, allTasks, users])

    const loadTasks = async () => {
        try {
            // For now, use mock data if API is not available
            // Use UUID format for mock IDs to avoid database errors
            const mockTasks: Task[] = [
                {
                    id: "00000000-0000-0000-0000-000000000001",
                    week_id: "00000000-0000-0000-0000-000000000001",
                    title_ja: "営業告知 (投稿)",
                    title_fr: null,
                    body_ja: null,
                    body_fr: null,
                    due_at: new Date("2026-01-20T18:00:00").toISOString(),
                    priority: "HIGH",
                    status: "TODO",
                    tag: "投稿",
                    assignee_user_id: null,
                    created_by: "00000000-0000-0000-0000-000000000001",
                    updated_by: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    translated_at: null,
                    needs_retranslate: false,
                },
                {
                    id: "00000000-0000-0000-0000-000000000002",
                    week_id: "00000000-0000-0000-0000-000000000001",
                    title_ja: "取り置き案内 (投稿)",
                    title_fr: null,
                    body_ja: null,
                    body_fr: null,
                    due_at: new Date("2026-01-23T20:00:00").toISOString(),
                    priority: "HIGH",
                    status: "TODO",
                    tag: "投稿",
                    assignee_user_id: null,
                    created_by: "00000000-0000-0000-0000-000000000001",
                    updated_by: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    translated_at: null,
                    needs_retranslate: false,
                },
                {
                    id: "00000000-0000-0000-0000-000000000003",
                    week_id: "00000000-0000-0000-0000-000000000001",
                    title_ja: "仕込み: 生地作成",
                    title_fr: null,
                    body_ja: null,
                    body_fr: null,
                    due_at: new Date("2026-01-24T09:00:00").toISOString(),
                    priority: "MEDIUM",
                    status: "IN_PROGRESS",
                    tag: "仕込み",
                    assignee_user_id: null,
                    created_by: "00000000-0000-0000-0000-000000000001",
                    updated_by: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    translated_at: null,
                    needs_retranslate: false,
                },
            ]

            // Try to fetch from API
            try {
                const res = await fetch(`/api/tasks?week_id=1`)
                if (res.ok) {
                    const data = await res.json()
                    setAllTasks(data.tasks || [])
                } else {
                    setAllTasks(mockTasks)
                }
            } catch {
                setAllTasks(mockTasks)
            }
        } catch (error) {
            console.error("Error loading tasks:", error)
        } finally {
            setIsLoading(false)
        }
    }

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
        }
    }

    const loadUsers = async () => {
        try {
            const res = await fetch("/api/users")
            if (res.ok) {
                const data = await res.json()
                setUsers(data.users || [])
            }
        } catch (error) {
            console.error("Error loading users:", error)
        }
    }

    const handleGenerateWeek = async () => {
        try {
            const res = await fetch("/api/weeks/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    week_key: currentWeekKey,
                    created_by: "1", // TODO: Get from session
                }),
            })

            if (res.ok) {
                const data = await res.json()
                alert(`${data.tasks_created}件のタスクを生成しました`)
                loadTasks()
                loadBusinessDates()
            }
        } catch (error) {
            console.error("Error generating week:", error)
        }
    }

    const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: newStatus,
                    updated_by: "1", // TODO: Get from session
                }),
            })

            if (res.ok) {
                const { task } = await res.json()
                // Update local state
                setAllTasks(allTasks.map(t => t.id === taskId ? task : t))
            }
        } catch (error) {
            console.error("Error updating task status:", error)
        }
    }

    const handleAssigneeChange = async (taskId: string, assigneeId: string) => {
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    assignee_user_id: assigneeId || null,
                    updated_by: "1", // TODO: Get from session
                }),
            })

            if (res.ok) {
                const { task } = await res.json()
                // Update local state
                setAllTasks(allTasks.map(t => t.id === taskId ? task : t))
            }
        } catch (error) {
            console.error("Error updating task assignee:", error)
        }
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header Section */}
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">ダッシュボード</h1>
                    <p className="text-sm sm:text-base text-muted-foreground text-pretty mt-1">
                        今週のタスク状況 ({currentWeekKey})
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                    <Button variant="outline" onClick={handleGenerateWeek} className="text-base sm:text-sm h-12 sm:h-10 touch-manipulation min-h-[44px]">
                        <CalendarIcon className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                        週を生成
                    </Button>
                    <Button className="text-base sm:text-sm h-12 sm:h-10 touch-manipulation min-h-[44px]">
                        <Plus className="mr-2 h-5 w-5 sm:h-4 sm:w-4" /> 新規タスク
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg sm:text-xl text-balance">タスク一覧</CardTitle>
                            <CardDescription className="text-sm sm:text-base text-pretty mt-1">
                                {viewMode === "all" ? "今週の全タスク" : "自分のタスク"}
                            </CardDescription>
                        </div>
                        <div className="flex rounded-lg border p-1 bg-muted/50 w-fit">
                            <Button
                                variant={viewMode === "all" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("all")}
                                className="h-11 sm:h-9 text-sm px-4 touch-manipulation min-h-[44px]"
                            >
                                全員
                            </Button>
                            <Button
                                variant={viewMode === "my" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("my")}
                                className="h-11 sm:h-9 text-sm px-4 touch-manipulation min-h-[44px]"
                                disabled={!currentUserId}
                            >
                                自分のタスク
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-center py-8 text-base sm:text-sm text-muted-foreground text-pretty">読み込み中...</div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-base sm:text-sm text-pretty mb-4">タスクがありません</p>
                        <Button onClick={handleGenerateWeek} className="mt-4 h-12 sm:h-10 text-base sm:text-sm touch-manipulation min-h-[44px]">
                            <Plus className="mr-2 h-5 w-5 sm:h-4 sm:w-4" /> 週を生成
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                        {tasks.map((task, index) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.15, delay: index * 0.05 }}
                                className="rounded-lg border p-4 sm:p-5 shadow-sm hover:bg-muted/50 active:bg-muted/70 transition-colors"
                                onClick={() => router.push(`/tasks/${task.id}`)}
                            >
                                {/* タイトル行 */}
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="font-semibold text-base sm:text-lg truncate min-h-[44px] flex items-center" title={task.title_ja}>{task.title_ja}</span>
                                        {task.tag && (
                                            <Badge variant="secondary" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">{getTagLabel(task.tag)}</Badge>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            router.push(`/tasks/${task.id}`)
                                        }}
                                        aria-label="詳細を表示"
                                        className="h-11 w-11 sm:h-10 sm:w-10 flex-shrink-0 touch-manipulation"
                                    >
                                        <MoreHorizontal className="h-5 w-5 sm:h-5 sm:w-5" />
                                    </Button>
                                </div>
                                {/* 期限とプルダウン行 */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="text-sm sm:text-base text-muted-foreground text-pretty">
                                        期限: <span className="tabular-nums">{new Date(task.due_at).toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" })}</span>
                                    </span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <select
                                            value={task.assignee_user_id || ""}
                                            onChange={(e) => {
                                                e.stopPropagation()
                                                handleAssigneeChange(task.id, e.target.value)
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-11 sm:h-10 px-3 sm:px-3 rounded-md border border-input bg-background text-sm sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-w-[110px] sm:min-w-[120px] touch-manipulation"
                                        >
                                            <option value="">未割当</option>
                                            {users.map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={task.status}
                                            onChange={(e) => {
                                                e.stopPropagation()
                                                handleStatusChange(task.id, e.target.value as TaskStatus)
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-11 sm:h-10 px-3 sm:px-3 rounded-md border border-input bg-background text-sm sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 touch-manipulation"
                                        >
                                            <option value="TODO">未着手</option>
                                            <option value="IN_PROGRESS">進行中</option>
                                            <option value="DONE">完了</option>
                                            <option value="BLOCKED">保留</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </CardContent>
            </Card>

            {/* Next Business Date Card */}
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
        </div>
    )
}
