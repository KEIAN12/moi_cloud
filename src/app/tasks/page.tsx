"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Task, User as UserType } from "@/lib/supabase/types"
import { getTagLabel } from "@/lib/utils/status"
import type { TaskStatus } from "@/lib/supabase/types"
import { getWeekKey } from "@/lib/utils/week"
import DashboardLayout from "@/components/layout/dashboard-layout"

export default function TasksPage() {
    const router = useRouter()
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentWeekKey] = useState(getWeekKey())
    const [users, setUsers] = useState<UserType[]>([])

    useEffect(() => {
        loadTasks()
        loadUsers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentWeekKey])

    const loadTasks = async () => {
        try {
            // Get week_id from week_key
            let weekId: string | null = null
            try {
                const weekRes = await fetch(`/api/weeks?week_key=${currentWeekKey}`)
                if (weekRes.ok) {
                    const weekData = await weekRes.json()
                    if (weekData.weeks && weekData.weeks.length > 0) {
                        weekId = weekData.weeks[0].id
                    }
                }
            } catch (error) {
                console.error("Error fetching week:", error)
            }

            // If no week found, try to get tasks without week_id filter (all tasks)
            if (!weekId) {
                try {
                    const res = await fetch(`/api/tasks`)
                    if (res.ok) {
                        const data = await res.json()
                        setTasks(data.tasks || [])
                    } else {
                        setTasks([])
                    }
                } catch {
                    setTasks([])
                }
            } else {
                // Fetch tasks for the current week
                try {
                    const res = await fetch(`/api/tasks?week_id=${weekId}`)
                    if (res.ok) {
                        const data = await res.json()
                        setTasks(data.tasks || [])
                    } else {
                        setTasks([])
                    }
                } catch {
                    setTasks([])
                }
            }
        } catch (error) {
            console.error("Error loading tasks:", error)
            setTasks([])
        } finally {
            setIsLoading(false)
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

    const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
        try {
            // Check if it's a mock task ID
            if (taskId.startsWith("00000000-0000-0000-0000-")) {
                // For mock tasks, just update local state
                setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
                return
            }

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
                setTasks(tasks.map(t => t.id === taskId ? task : t))
                // Reload tasks to ensure consistency
                await loadTasks()
            } else {
                const errorData = await res.json().catch(() => ({}))
                console.error("Error updating task status:", errorData.error || "Unknown error")
                alert(`ステータスの更新に失敗しました: ${errorData.error || "不明なエラー"}`)
            }
        } catch (error) {
            console.error("Error updating task status:", error)
            alert("ステータスの更新中にエラーが発生しました")
        }
    }

    const handleAssigneeChange = async (taskId: string, assigneeId: string) => {
        try {
            // Check if it's a mock task ID
            if (taskId.startsWith("00000000-0000-0000-0000-")) {
                // For mock tasks, just update local state
                setTasks(tasks.map(t => t.id === taskId ? { ...t, assignee_user_id: assigneeId || null } : t))
                return
            }

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
                setTasks(tasks.map(t => t.id === taskId ? task : t))
                // Reload tasks to ensure consistency
                await loadTasks()
            } else {
                const errorData = await res.json().catch(() => ({}))
                console.error("Error updating task assignee:", errorData.error || "Unknown error")
                alert(`担当者の更新に失敗しました: ${errorData.error || "不明なエラー"}`)
            }
        } catch (error) {
            console.error("Error updating task assignee:", error)
            alert("担当者の更新中にエラーが発生しました")
        }
    }

    // Get assignee color class based on user role
    const getAssigneeColorClass = (assigneeId: string | null) => {
        if (!assigneeId) {
            return "border-l-4 border-l-gray-300"
        }
        
        const assignee = users.find(u => u.id === assigneeId)
        if (!assignee) {
            return "border-l-4 border-l-gray-300"
        }

        // Kaori (admin) - ローズ系
        if (assignee.role === "admin" || assignee.name.toLowerCase().includes("kaori")) {
            return "border-l-4 border-l-rose-500"
        }
        // Maxime (worker) - エメラルド系
        if (assignee.role === "worker" || assignee.name.toLowerCase().includes("maxime")) {
            return "border-l-4 border-l-emerald-500"
        }
        // Mai (coadmin) - スカイ系
        if (assignee.role === "coadmin" || assignee.name.toLowerCase().includes("mai")) {
            return "border-l-4 border-l-sky-500"
        }

        return "border-l-4 border-l-gray-300"
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 sm:space-y-8">
                {/* Header */}
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">タスク管理</h1>
                        <p className="text-sm sm:text-base text-muted-foreground text-pretty mt-1">
                            今週のタスク ({currentWeekKey})
                        </p>
                    </div>
                    <Button className="text-base sm:text-sm h-12 sm:h-10">
                        <Plus className="mr-2 h-5 w-5 sm:h-4 sm:w-4" /> 新規タスク
                    </Button>
                </div>

                {/* Tasks List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl text-balance">タスク一覧</CardTitle>
                        <CardDescription className="text-sm sm:text-base text-pretty">今週の全タスク</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8 text-base sm:text-sm text-muted-foreground text-pretty">読み込み中...</div>
                        ) : tasks.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="text-base sm:text-sm text-pretty mb-4">タスクがありません</p>
                            </div>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                {tasks.map((task, index) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.15, delay: index * 0.05 }}
                                        className={`rounded-lg border p-4 sm:p-5 shadow-sm hover:bg-muted/50 active:bg-muted/70 transition-colors ${getAssigneeColorClass(task.assignee_user_id)}`}
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
                                        <div 
                                            className="flex items-center justify-between gap-2 flex-wrap"
                                            onClick={(e) => e.stopPropagation()}
                                            onTouchStart={(e) => e.stopPropagation()}
                                        >
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
                                                    onTouchStart={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    className="h-11 sm:h-10 px-3 sm:px-3 rounded-md border border-input bg-background text-sm sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-w-[110px] sm:min-w-[120px] touch-manipulation relative z-10"
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
                                                    onTouchStart={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    className="h-11 sm:h-10 px-3 sm:px-3 rounded-md border border-input bg-background text-sm sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 touch-manipulation relative z-10"
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
            </div>
        </DashboardLayout>
    )
}
