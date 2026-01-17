"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success'
  message: string
  link: string
  created_at: string
  read: boolean
}

interface NotificationListProps {
  notifications: Notification[]
  onClose: () => void
  onMarkAsRead: (id: string) => void
}

export function NotificationList({ notifications, onClose, onMarkAsRead }: NotificationListProps) {
  const router = useRouter()

  const handleNotificationClick = (notification: Notification) => {
    onMarkAsRead(notification.id)
    if (notification.link) {
      router.push(notification.link)
      onClose()
    }
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40 bg-black/20" 
        onClick={onClose}
      />
      {/* Notification List */}
      <div className="fixed top-16 right-4 z-50 w-full max-w-md pointer-events-auto sm:top-20 sm:right-6">
        <Card className="shadow-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-lg">通知</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 touch-manipulation">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                通知はありません
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <AnimatePresence>
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.15, delay: index * 0.05 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm text-pretty">{notification.message}</p>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {new Date(notification.created_at).toLocaleString("ja-JP", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {!notification.read && (
                              <Badge variant="secondary" className="text-xs">
                                新着
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
