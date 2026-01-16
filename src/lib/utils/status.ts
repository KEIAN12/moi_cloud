import type { TaskStatus, Priority } from "@/lib/supabase/types"

/**
 * タスクステータスを日本語に変換
 */
export function getStatusLabel(status: TaskStatus): string {
  const statusMap: Record<TaskStatus, string> = {
    TODO: "未着手",
    IN_PROGRESS: "進行中",
    DONE: "完了",
    BLOCKED: "保留",
  }
  return statusMap[status] || status
}

/**
 * 優先度を日本語に変換
 */
export function getPriorityLabel(priority: Priority): string {
  const priorityMap: Record<Priority, string> = {
    HIGH: "高",
    MEDIUM: "中",
    LOW: "低",
  }
  return priorityMap[priority] || priority
}

/**
 * タグを日本語に変換
 */
export function getTagLabel(tag: string | null): string {
  if (!tag) return ""
  
  const tagMap: Record<string, string> = {
    "Promotion": "投稿",
    "Prep": "仕込み",
    "Opening": "開店",
    "Closing": "締め",
    "Reservation": "取り置き",
  }
  
  return tagMap[tag] || tag
}
