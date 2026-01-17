"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Plus, Clock, User, MessageSquare, Send, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import type { Task, ChecklistItem, User as UserType, Comment } from "@/lib/supabase/types"
import { getStatusLabel } from "@/lib/utils/status"

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [newChecklistText, setNewChecklistText] = useState("")
  const [selectedAssignee, setSelectedAssignee] = useState("")
  const [taskAssignee, setTaskAssignee] = useState<string>("")
  const [newCommentText, setNewCommentText] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(true)

  useEffect(() => {
    // Get current user ID from session
    if (typeof window !== "undefined") {
      const userId = sessionStorage.getItem("userId")
      if (userId) {
        // Map session userId to database user ID
        loadUsers().then(() => {
          const user = users.find(u => {
            const nameLower = u.name.toLowerCase()
            if (userId === "kaori" && nameLower.includes("kaori")) return true
            if (userId === "mai" && nameLower.includes("mai")) return true
            if (userId === "maxime" && nameLower.includes("maxime")) return true
            return false
          })
          if (user) {
            setCurrentUserId(user.id)
          } else {
            // Fallback: try direct ID mapping
            const userIdMap: Record<string, string> = {
              "kaori": "00000000-0000-0000-0000-000000000001",
              "mai": "00000000-0000-0000-0000-000000000002",
              "maxime": "00000000-0000-0000-0000-000000000003",
            }
            setCurrentUserId(userIdMap[userId] || userId)
          }
        })
      }
    }
    loadTask()
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  const loadTask = async () => {
    try {
      // Check if this is a mock task ID (starts with all zeros)
      const isMockTask = taskId.startsWith("00000000-0000-0000-0000-")
      
      if (isMockTask) {
        // For mock tasks, create a mock task object based on the ID
        let mockTask: Task
        
        switch (taskId) {
          case "00000000-0000-0000-0000-000000000001":
            mockTask = {
              id: taskId,
              week_id: "00000000-0000-0000-0000-000000000001",
              title_ja: "営業告知 (投稿)",
              title_fr: null,
              body_ja: null,
              body_fr: null,
              due_at: new Date("2026-01-20T18:00:00").toISOString(),
              priority: "HIGH",
              status: "TODO",
              tag: "Promotion",
              assignee_user_id: null,
              created_by: "00000000-0000-0000-0000-000000000001",
              updated_by: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              translated_at: null,
              needs_retranslate: false,
            }
            break
          case "00000000-0000-0000-0000-000000000002":
            mockTask = {
              id: taskId,
              week_id: "00000000-0000-0000-0000-000000000001",
              title_ja: "取り置き案内 (投稿)",
              title_fr: null,
              body_ja: null,
              body_fr: null,
              due_at: new Date("2026-01-23T20:00:00").toISOString(),
              priority: "HIGH",
              status: "TODO",
              tag: "Promotion",
              assignee_user_id: null,
              created_by: "00000000-0000-0000-0000-000000000001",
              updated_by: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              translated_at: null,
              needs_retranslate: false,
            }
            break
          case "00000000-0000-0000-0000-000000000003":
            mockTask = {
              id: taskId,
              week_id: "00000000-0000-0000-0000-000000000001",
              title_ja: "仕込み: 生地作成",
              title_fr: null,
              body_ja: null,
              body_fr: null,
              due_at: new Date("2026-01-24T09:00:00").toISOString(),
              priority: "MEDIUM",
              status: "IN_PROGRESS",
              tag: "Prep",
              assignee_user_id: null,
              created_by: "00000000-0000-0000-0000-000000000001",
              updated_by: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              translated_at: null,
              needs_retranslate: false,
            }
            break
          default:
            mockTask = {
              id: taskId,
              week_id: "00000000-0000-0000-0000-000000000001",
              title_ja: "モックタスク",
              title_fr: null,
              body_ja: "これはモックデータです。実際のデータベースからタスクを取得できませんでした。",
              body_fr: null,
              due_at: new Date().toISOString(),
              priority: "MEDIUM",
              status: "TODO",
              tag: null,
              assignee_user_id: null,
              created_by: "00000000-0000-0000-0000-000000000001",
              updated_by: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              translated_at: null,
              needs_retranslate: false,
            }
        }
        
        setTask(mockTask)
        setChecklistItems([])
        setTaskAssignee("")
        setIsLoading(false)
        return
      }

      const res = await fetch(`/api/tasks/${taskId}`)
      const data = await res.json()
      
      if (!res.ok) {
        console.error("API Error:", data.error || "Failed to load task")
        // エラーでもタスクが返されている可能性があるので確認
        if (data.task) {
          setTask(data.task)
          setChecklistItems(data.checklist_items || [])
          setTaskAssignee(data.task.assignee_user_id || "")
        }
        setIsLoading(false)
        return
      }
      
      if (data.task) {
        setTask(data.task)
        setChecklistItems(data.checklist_items || [])
        setComments(data.comments || [])
        setTaskAssignee(data.task.assignee_user_id || "")
      } else {
        console.error("Task not found in response:", data)
      }
    } catch (error) {
      console.error("Error loading task:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/users")
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error loading users:", error)
      // Fallback to mock data
      setUsers([
        { id: "1", name: "Kaori", role: "admin", default_language: "ja", created_at: "", updated_at: "" },
        { id: "2", name: "Mai", role: "coadmin", default_language: "ja", created_at: "", updated_at: "" },
        { id: "3", name: "Maxime", role: "worker", default_language: "fr", created_at: "", updated_at: "" },
      ])
    }
  }

  const handleUpdateTaskAssignee = async (assigneeId: string) => {
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
        const { task: updatedTask } = await res.json()
        setTask(updatedTask)
        setTaskAssignee(updatedTask.assignee_user_id || "")
      }
    } catch (error) {
      console.error("Error updating task assignee:", error)
    }
  }

  const handleAddChecklistItem = async () => {
    if (!newChecklistText.trim() || !selectedAssignee) return

    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          text_ja: newChecklistText,
          assignee_user_id: selectedAssignee,
          sort_order: checklistItems.length,
        }),
      })

      if (res.ok) {
        const { item } = await res.json()
        setChecklistItems([...checklistItems, item])
        setNewChecklistText("")
        setSelectedAssignee("")
      }
    } catch (error) {
      console.error("Error adding checklist item:", error)
    }
  }

  const handleToggleChecklist = async (itemId: string, currentDone: boolean) => {
    try {
      const res = await fetch(`/api/checklist/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_done: !currentDone,
          done_by: currentUserId || "1",
        }),
      })

      if (res.ok) {
        const { item } = await res.json()
        setChecklistItems(checklistItems.map((i) => (i.id === itemId ? item : i)))
      }
    } catch (error) {
      console.error("Error toggling checklist:", error)
    }
  }

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !currentUserId) return

    try {
      // Detect if input is likely French (simple heuristic: check for French characters/words)
      const isLikelyFrench = /[àâäéèêëïîôùûüÿç]/i.test(newCommentText) || 
                             /\b(le|la|les|un|une|des|et|ou|de|du|dans|sur|avec|pour|par)\b/i.test(newCommentText)

      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body_ja: isLikelyFrench ? null : newCommentText,
          body_fr: isLikelyFrench ? newCommentText : null,
          author_user_id: currentUserId,
        }),
      })

      if (res.ok) {
        const { comment } = await res.json()
        setComments([...comments, comment])
        setNewCommentText("")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-muted-foreground text-pretty">読み込み中...</div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-muted-foreground text-pretty">タスクが見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-white pb-20">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-white px-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")} aria-label="戻る" className="h-11 w-11 sm:h-10 sm:w-10 touch-manipulation">
            <ArrowLeft className="h-6 w-6 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-lg sm:text-xl font-bold text-balance">タスク詳細</h1>
        </div>
        <Button variant="outline" onClick={() => setIsEditing(!isEditing)} className="h-11 sm:h-10 text-base sm:text-sm touch-manipulation min-h-[44px]">
          {isEditing ? "キャンセル" : "編集"}
        </Button>
      </header>

      <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl text-balance">{task.title_ja}</CardTitle>
            <CardDescription className="text-sm sm:text-base text-pretty mt-1">
              <span className="tabular-nums">{new Date(task.due_at).toLocaleString("ja-JP")}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-base sm:text-sm">ステータス</Label>
                <Badge variant="outline" className="ml-2 text-sm sm:text-base">{getStatusLabel(task.status)}</Badge>
              </div>
              <div>
                <Label className="text-base sm:text-sm">担当者</Label>
                {isEditing ? (
                  <select
                    className="mt-2 w-full rounded-md border border-input bg-background px-3 py-3 sm:py-2 text-base sm:text-sm h-12 sm:h-10"
                    value={taskAssignee}
                    onChange={(e) => {
                      setTaskAssignee(e.target.value)
                      handleUpdateTaskAssignee(e.target.value)
                    }}
                  >
                    <option value="">未割当</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-2 flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base sm:text-sm text-muted-foreground text-pretty">
                      {task.assignee_user_id ? users.find(u => u.id === task.assignee_user_id)?.name || "不明" : "未割当"}
                    </span>
                  </div>
                )}
              </div>
              {task.body_ja && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-base sm:text-sm">詳細</Label>
                    {task.needs_retranslate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-11 sm:h-8 text-xs touch-manipulation min-h-[44px]"
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/translate/retry", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ type: "task", id: taskId }),
                            })
                            if (res.ok) {
                              const data = await res.json()
                              setTask(data.task)
                            }
                          } catch (error) {
                            console.error("Error retrying translation:", error)
                          }
                        }}
                      >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        翻訳再実行
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 text-base sm:text-sm text-muted-foreground text-pretty">{task.body_ja}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl text-balance">チェックリスト</CardTitle>
                <CardDescription className="text-sm sm:text-base text-pretty">作業項目を管理</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChecklistExpanded(!isChecklistExpanded)}
                className="h-11 w-11 sm:h-10 sm:w-10 touch-manipulation"
                aria-label={isChecklistExpanded ? "折りたたむ" : "展開する"}
              >
                {isChecklistExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isChecklistExpanded && (
            <div className="space-y-3">
              {checklistItems.map((item) => {
                const assignee = users.find((u) => u.id === item.assignee_user_id)
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => handleToggleChecklist(item.id, item.is_done)}
                    className={`flex items-center space-x-3 rounded-md border p-4 sm:p-3 active:bg-muted/50 touch-manipulation min-h-[44px] cursor-pointer ${
                      item.is_done ? "bg-muted/50" : "hover:bg-muted/30"
                    }`}
                  >
                    <Checkbox
                      checked={item.is_done}
                      onCheckedChange={() => handleToggleChecklist(item.id, item.is_done)}
                      className="h-7 w-7 sm:h-5 sm:w-5 touch-manipulation"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-base sm:text-sm font-medium text-pretty ${
                          item.is_done ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {item.text_ja}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <User className="h-4 w-4 sm:h-3 sm:w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm sm:text-xs text-muted-foreground text-pretty">
                          {assignee?.name || "未割当"}
                        </span>
                        {item.due_at && (
                          <>
                            <Clock className="h-4 w-4 sm:h-3 sm:w-3 text-muted-foreground ml-2 flex-shrink-0" />
                            <span className="text-sm sm:text-xs text-muted-foreground tabular-nums">
                              {new Date(item.due_at).toLocaleTimeString("ja-JP", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}

              {isEditing && (
                <div className="border-t pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base sm:text-sm">新しいチェック項目</Label>
                    <Input
                      placeholder="チェック項目を入力..."
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      className="h-12 sm:h-10 text-base sm:text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base sm:text-sm">担当者</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-3 sm:py-2 text-base sm:text-sm h-12 sm:h-10 touch-manipulation"
                      value={selectedAssignee}
                      onChange={(e) => setSelectedAssignee(e.target.value)}
                    >
                      <option value="">選択してください</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handleAddChecklistItem} className="w-full h-12 sm:h-10 text-base sm:text-sm touch-manipulation min-h-[44px]">
                    <Plus className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                    追加
                  </Button>
                </div>
              )}
            </div>
            )}
            {!isChecklistExpanded && checklistItems.length > 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                {checklistItems.filter(item => !item.is_done).length}件の未完了項目
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-balance flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              コメント
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-pretty">
              {comments.length}件のコメント
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Comments List */}
              {comments.length > 0 && (
                <div className="space-y-4">
                  {comments.map((comment) => {
                    const author = users.find((u) => u.id === comment.author_user_id)
                    const isFrenchUser = author?.default_language === "fr"
                    return (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className="rounded-lg border p-4 bg-muted/30"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium text-pretty">
                                {author?.name || "不明"}
                              </span>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {new Date(comment.created_at).toLocaleString("ja-JP")}
                              </span>
                            </div>
                            <p className="text-base sm:text-sm text-pretty whitespace-pre-wrap">
                              {isFrenchUser ? (comment.body_fr || comment.body_ja) : (comment.body_ja || comment.body_fr)}
                            </p>
                            {comment.needs_retranslate && (
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  翻訳待ち
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-11 sm:h-6 text-xs touch-manipulation min-h-[44px]"
                                  onClick={async () => {
                                    try {
                                      const res = await fetch("/api/translate/retry", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ type: "comment", id: comment.id }),
                                      })
                                      if (res.ok) {
                                        const data = await res.json()
                                        setComments(comments.map(c => c.id === comment.id ? data.comment : c))
                                      }
                                    } catch (error) {
                                      console.error("Error retrying translation:", error)
                                    }
                                  }}
                                >
                                  <RefreshCw className="mr-1 h-3 w-3" />
                                  再翻訳
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* Comment Input */}
              <div className="border-t pt-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-base sm:text-sm">コメントを追加</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="コメントを入力... (日本語またはフランス語)"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          handleAddComment()
                        }
                      }}
                      className="h-12 sm:h-10 text-base sm:text-sm flex-1"
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newCommentText.trim() || !currentUserId}
                      className="h-12 sm:h-10 text-base sm:text-sm touch-manipulation min-h-[44px]"
                    >
                      <Send className="h-5 w-5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-pretty">
                    Cmd/Ctrl + Enter で送信
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
