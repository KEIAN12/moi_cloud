"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    LayoutDashboard,
    CheckSquare,
    Calendar,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    BarChart3
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/notifications/notification-bell"

function getInitialUserInfo(): { name: string; role: string } {
    if (typeof window === "undefined") {
        return { name: "Kaori", role: "店長 (Admin)" }
    }
    const name = sessionStorage.getItem("userName") || "Kaori"
    const userId = sessionStorage.getItem("userId") || "kaori"
    const roleMap: Record<string, string> = {
        "kaori": "店長 (Admin)",
        "mai": "共同管理者",
        "maxime": "スタッフ",
    }
    return { name, role: roleMap[userId] || "店長 (Admin)" }
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const userInfo = getInitialUserInfo()
    const userName = userInfo.name
    const userRole = userInfo.role

    const navItems = [
        { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
        { href: "/tasks", label: "タスク管理", icon: CheckSquare },
        { href: "/schedule", label: "スケジュール", icon: Calendar },
        { href: "/dashboard/analytics", label: "分析", icon: BarChart3 },
        { href: "/settings", label: "設定", icon: Settings },
    ]

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

    return (
        <div className="flex h-dvh overflow-hidden bg-white">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 z-20 bg-black md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-xl transition-transform duration-150 md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex h-16 items-center justify-between px-4 sm:px-6 border-b">
                        <span className="text-lg sm:text-xl font-bold tracking-tight text-primary text-balance">moi Cloud</span>
                        <Button variant="ghost" size="icon" className="md:hidden h-11 w-11 sm:h-10 sm:w-10 touch-manipulation" onClick={toggleSidebar} aria-label="サイドバーを閉じる">
                            <X className="h-6 w-6 sm:h-5 sm:w-5" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 px-2 sm:px-3 py-4">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link key={item.href} href={item.href} onClick={() => setIsSidebarOpen(false)}>
                                    <div
                                        className={`flex items-center rounded-lg px-4 py-4 sm:py-3 text-base sm:text-sm font-medium transition-colors active:bg-primary/20 touch-manipulation min-h-[44px] ${isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            }`}
                                    >
                                        <item.icon className={`mr-3 h-6 w-6 sm:h-5 sm:w-5 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                        <span className="text-pretty">{item.label}</span>
                                    </div>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Footer User Profile */}
                    <div className="border-t p-4">
                        <div className="flex items-center space-x-3 rounded-lg bg-gray-100 p-3">
                            <div className="flex h-12 w-12 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 flex-shrink-0">
                                <User className="h-7 w-7 sm:h-6 sm:w-6" />
                            </div>
                            <div className="flex-1 overflow-hidden min-w-0">
                                <p className="truncate text-base sm:text-sm font-medium text-balance">{userName || "Kaori"}</p>
                                <p className="truncate text-sm sm:text-xs text-muted-foreground text-pretty">{userRole || "店長 (Admin)"}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-10 sm:w-10 text-muted-foreground hover:text-destructive flex-shrink-0 touch-manipulation" onClick={() => router.push('/login')} aria-label="ログアウト">
                                <LogOut className="h-5 w-5 sm:h-4 sm:w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Header (Mobile) */}
                <header className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm md:hidden">
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="メニューを開く" className="h-11 w-11 touch-manipulation">
                        <Menu className="h-6 w-6" />
                    </Button>
                    <span className="font-semibold text-base text-foreground text-balance">moi Cloud</span>
                    <NotificationBell />
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
