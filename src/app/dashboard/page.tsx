"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Calendar as CalendarIcon, MoreHorizontal, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Task, User as UserType } from "@/lib/supabase/types"
import { getWeekKey } from "@/lib/utils/week"
import { getTagLabel } from "@/lib/utils/status"
import type { TaskStatus } from "@/lib/supabase/types"
import { BusinessCalendar } from "@/components/calendar/business-calendar"

interface BusinessDate {
  week_key: string
  business_date_default: string
  business_date_actual: string | null
}

// ダミータスク（テスト用）
const DUMMY_TASKS: Task[] = [
    {
        id: "dummy-1",
        week_id: "dummy-week",
        title_ja: "Instagram投稿: 営業日とラインナップ案内",
        title_fr: "Publication Instagram: annonce du jour d'ouverture et du menu",
        body_ja: "今週の営業日とラインナップをInstagramに投稿する",
        body_fr: null,
        due_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        priority: "HIGH",
        status: "TODO",
        tag: "Promotion",
        assignee_user_id: null,
        created_by: "1",
        updated_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        translated_at: null,
        needs_retranslate: false,
    },
    {
        id: "dummy-2",
        week_id: "dummy-week",
        title_ja: "取り置き対応",
        title_fr: "Gestion des réservations",
        body_ja: "お取り置きの申込者への返信と集計",
        body_fr: null,
        due_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        priority: "MEDIUM",
        status: "IN_PROGRESS",
        tag: "Reservation",
        assignee_user_id: null,
        created_by: "1",
        updated_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        translated_at: null,
        needs_retranslate: false,
    },
    {
        id: "dummy-3",
        week_id: "dummy-week",
        title_ja: "仕込み作業",
        title_fr: "Préparation des ingrédients",
        body_ja: "材料の仕込み、計量",
        body_fr: null,
        due_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        priority: "HIGH",
        status: "TODO",
        tag: "Prep",
        assignee_user_id: null,
        created_by: "1",
        updated_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        translated_at: null,
        needs_retranslate: false,
    },
    {
        id: "dummy-4",
        week_id: "dummy-week",
        title_ja: "開店準備",
        title_fr: "Préparation de l'ouverture",
        body_ja: "開店前の準備作業",
        body_fr: null,
        due_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        priority: "MEDIUM",
        status: "TODO",
        tag: "Opening",
        assignee_user_id: null,
        created_by: "1",
        updated_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        translated_at: null,
        needs_retranslate: false,
    },
    {
        id: "dummy-5",
        week_id: "dummy-week",
        title_ja: "閉店作業",
        title_fr: "Travaux de fermeture",
        body_ja: "閉店後の片付けと締め",
        body_fr: null,
        due_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        priority: "LOW",
        status: "DONE",
        tag: "Closing",
        assignee_user_id: null,
        created_by: "1",
        updated_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        translated_at: null,
        needs_retranslate: false,
    },
]

export default function DashboardPage() {
    const router = useRouter()
    const [tasks, setTasks] = useState<Task[]>([])
    const [allTasks, setAllTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentWeekKey] = useState(getWeekKey())
    const [businessDates, setBusinessDates] = useState<BusinessDate[]>([])
    const [nextBusinessDate, setNextBusinessDate] = useState<Date | null>(null)
    const [users, setUsers] = useState<UserType[]>([])
    const [viewMode, setViewMode] = useState<"all" | "my">("all")
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    // タスク作成モーダル
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newTaskTitle, setNewTaskTitle] = useState("")
    const [newTaskDueDate, setNewTaskDueDate] = useState("")
    const [newTaskDueTime, setNewTaskDueTime] = useState("18:00")
    const [newTaskPriority, setNewTaskPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM")
    const [newTaskTag, setNewTaskTag] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    useEffect(() => {
        // Get current user ID from session
        if (typeof window !== "undefined") {
            const userId = sessionStorage.getItem("userId")
            setCurrentUserId(userId)
        }
        loadTasks()
        loadBusinessDates()
        loadUsers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

            let loadedTasks: Task[] = []

            // If no week found, try to get tasks without week_id filter (all tasks)
            if (!weekId) {
                try {
                    const res = await fetch(`/api/tasks`)
                    if (res.ok) {
                        const data = await res.json()
                        loadedTasks = data.tasks || []
                    }
                } catch {
                    loadedTasks = []
                }
            } else {
                // Fetch tasks for the current week
                try {
                    const res = await fetch(`/api/tasks?week_id=${weekId}`)
                    if (res.ok) {
                        const data = await res.json()
                        loadedTasks = data.tasks || []
                    }
                } catch {
                    loadedTasks = []
                }
            }

            // 実データがない場合はダミータスクを表示
            if (loadedTasks.length === 0) {
                setAllTasks(DUMMY_TASKS)
            } else {
                setAllTasks(loadedTasks)
            }
        } catch (error) {
            console.error("Error loading tasks:", error)
            // エラー時もダミータスクを表示
            setAllTasks(DUMMY_TASKS)
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
            // Check if it's a mock task ID
            if (taskId.startsWith("00000000-0000-0000-0000-")) {
                // For mock tasks, just update local state
                setAllTasks(allTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
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
                setAllTasks(allTasks.map(t => t.id === taskId ? task : t))
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
                setAllTasks(allTasks.map(t => t.id === taskId ? { ...t, assignee_user_id: assigneeId || null } : t))
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
                setAllTasks(allTasks.map(t => t.id === taskId ? task : t))
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

    const openCreateModal = () => {
        // デフォルト値を設定
        const defaultDate = nextBusinessDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        setNewTaskDueDate(defaultDate.toISOString().split('T')[0])
        setNewTaskDueTime("18:00")
        setNewTaskTitle("")
        setNewTaskPriority("MEDIUM")
        setNewTaskTag("")
        setIsCreateModalOpen(true)
    }

    const handleCreateTask = async () => {
        if (!newTaskTitle.trim()) {
            return
        }

        setIsCreating(true)

        try {
            // Get current week_id from week_key
            const res = await fetch(`/api/weeks?week_key=${currentWeekKey}`)
            let weekId = "dummy-week"

            if (res.ok) {
                const data = await res.json()
                const week = data.weeks?.[0]
                if (week?.id) {
                    weekId = week.id
                }
            }

            // Calculate due date
            const dueDate = new Date(`${newTaskDueDate}T${newTaskDueTime}:00`)

            // Create task
            const createRes = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    week_id: weekId,
                    title_ja: newTaskTitle.trim(),
                    body_ja: null,
                    due_at: dueDate.toISOString(),
                    priority: newTaskPriority,
                    tag: newTaskTag || null,
                    created_by: "1", // TODO: Get from session
                }),
            })

            if (createRes.ok) {
                await createRes.json()
                setIsCreateModalOpen(false)
                loadTasks()
            } else {
                // APIエラーの場合、ダミータスクとして追加
                const newTask: Task = {
                    id: `dummy-${Date.now()}`,
                    week_id: weekId,
                    title_ja: newTaskTitle.trim(),
                    title_fr: null,
                    body_ja: null,
                    body_fr: null,
                    due_at: dueDate.toISOString(),
                    priority: newTaskPriority,
                    status: "TODO",
                    tag: newTaskTag || null,
                    assignee_user_id: null,
                    created_by: "1",
                    updated_by: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    translated_at: null,
                    needs_retranslate: false,
                }
                setAllTasks([newTask, ...allTasks])
                setIsCreateModalOpen(false)
            }
        } catch (error) {
            console.error("Error creating task:", error)
            // エラー時もダミータスクとして追加
            const dueDate = new Date(`${newTaskDueDate}T${newTaskDueTime}:00`)
            const newTask: Task = {
                id: `dummy-${Date.now()}`,
                week_id: "dummy-week",
                title_ja: newTaskTitle.trim(),
                title_fr: null,
                body_ja: null,
                body_fr: null,
                due_at: dueDate.toISOString(),
                priority: newTaskPriority,
                status: "TODO",
                tag: newTaskTag || null,
                assignee_user_id: null,
                created_by: "1",
                updated_by: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                translated_at: null,
                needs_retranslate: false,
            }
            setAllTasks([newTask, ...allTasks])
            setIsCreateModalOpen(false)
        } finally {
            setIsCreating(false)
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
                    <Button
                        className="text-base sm:text-sm h-12 sm:h-10 touch-manipulation min-h-[44px]"
                        onClick={openCreateModal}
                    >
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

            {/* タスク作成モーダル */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setIsCreateModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-4 border-b">
                                <h2 className="text-lg font-semibold">新規タスク作成</h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="h-10 w-10"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            <div className="p-4 space-y-4">
                                {/* タイトル */}
                                <div className="space-y-2">
                                    <Label htmlFor="task-title" className="text-sm font-medium">
                                        タイトル <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="task-title"
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        placeholder="タスクのタイトルを入力"
                                        className="h-12 text-base"
                                        autoFocus
                                    />
                                </div>

                                {/* 期限日 */}
                                <div className="space-y-2">
                                    <Label htmlFor="task-due-date" className="text-sm font-medium">
                                        期限日
                                    </Label>
                                    <Input
                                        id="task-due-date"
                                        type="date"
                                        value={newTaskDueDate}
                                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                                        className="h-12 text-base"
                                    />
                                </div>

                                {/* 期限時間 */}
                                <div className="space-y-2">
                                    <Label htmlFor="task-due-time" className="text-sm font-medium">
                                        期限時間
                                    </Label>
                                    <Input
                                        id="task-due-time"
                                        type="time"
                                        value={newTaskDueTime}
                                        onChange={(e) => setNewTaskDueTime(e.target.value)}
                                        className="h-12 text-base"
                                    />
                                </div>

                                {/* 優先度 */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">優先度</Label>
                                    <div className="flex gap-2">
                                        {[
                                            { value: "HIGH", label: "高", color: "bg-red-100 text-red-700 border-red-300" },
                                            { value: "MEDIUM", label: "中", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
                                            { value: "LOW", label: "低", color: "bg-green-100 text-green-700 border-green-300" },
                                        ].map((priority) => (
                                            <button
                                                key={priority.value}
                                                type="button"
                                                onClick={() => setNewTaskPriority(priority.value as "HIGH" | "MEDIUM" | "LOW")}
                                                className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                                                    newTaskPriority === priority.value
                                                        ? priority.color + " border-current"
                                                        : "bg-gray-50 text-gray-500 border-gray-200"
                                                }`}
                                            >
                                                {priority.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* タグ */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">タグ</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { value: "", label: "なし" },
                                            { value: "Promotion", label: "投稿" },
                                            { value: "Reservation", label: "取り置き" },
                                            { value: "Prep", label: "仕込み" },
                                            { value: "Opening", label: "開店" },
                                            { value: "Closing", label: "閉店" },
                                        ].map((tag) => (
                                            <button
                                                key={tag.value}
                                                type="button"
                                                onClick={() => setNewTaskTag(tag.value)}
                                                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                                                    newTaskTag === tag.value
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                                }`}
                                            >
                                                {tag.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 p-4 border-t">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-12"
                                    onClick={() => setIsCreateModalOpen(false)}
                                >
                                    キャンセル
                                </Button>
                                <Button
                                    className="flex-1 h-12"
                                    onClick={handleCreateTask}
                                    disabled={!newTaskTitle.trim() || isCreating}
                                >
                                    {isCreating ? "作成中..." : "作成"}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
