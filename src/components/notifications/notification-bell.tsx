"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NotificationList } from "./notification-list"

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success'
  message: string
  link: string
  created_at: string
  read: boolean
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get current user ID from session
    if (typeof window !== "undefined") {
      const userId = sessionStorage.getItem("userId")
      if (userId) {
        // Map to database user ID
        // This is a simplified version - in production, you'd want a proper mapping
        const userIdMap: Record<string, string> = {
          "kaori": "00000000-0000-0000-0000-000000000001",
          "mai": "00000000-0000-0000-0000-000000000002",
          "maxime": "00000000-0000-0000-0000-000000000003",
        }
        setCurrentUserId(userIdMap[userId] || userId)
      }
    }
  }, [])

  useEffect(() => {
    if (!currentUserId) return

    const loadNotifications = async () => {
      try {
        const res = await fetch(`/api/notifications?user_id=${currentUserId}&unread_only=true`)
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications || [])
          setUnreadCount(data.notifications?.filter((n: Notification) => !n.read).length || 0)
        }
      } catch (error) {
        console.error("Error loading notifications:", error)
      }
    }

    loadNotifications()
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000)

    return () => clearInterval(interval)
  }, [currentUserId])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: notificationId }),
      })
      setNotifications(notifications.map(n => n.id === notificationId ? { ...n, read: true } : n))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 w-10"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>
      {isOpen && (
        <NotificationList
          notifications={notifications}
          onClose={() => setIsOpen(false)}
          onMarkAsRead={handleMarkAsRead}
        />
      )}
    </div>
  )
}
