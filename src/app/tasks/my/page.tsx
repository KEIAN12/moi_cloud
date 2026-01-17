"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Clock, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { BusinessCalendar } from "@/components/calendar/business-calendar"

interface BusinessDate {
  week_key: string
  business_date_default: string
  business_date_actual: string | null
}

interface ChecklistItem {
    id: string
    text: string
    is_done: boolean
    due_at: string | null
}

interface TaskGroup {
    task_id: string
    task_title: string
    due_at: string
    items: ChecklistItem[]
}

export default function MyTasksPage() {
    const router = useRouter()
    const [tasks, setTasks] = useState<TaskGroup[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [businessDates, setBusinessDates] = useState<BusinessDate[]>([])
    const userId = "3" // TODO: Get from session (Maxime's user ID)

    useEffect(() => {
        loadMyTasks()
        loadBusinessDates()
    }, [])

    const loadBusinessDates = async () => {
        try {
            const res = await fetch("/api/weeks?limit=12")
            if (res.ok) {
                const data = await res.json()
                setBusinessDates(data.weeks || [])
            }
        } catch (error) {
            console.error("Error loading business dates:", error)
        }
    }

    const loadMyTasks = async () => {
        try {
            const res = await fetch(`/api/checklist/my?user_id=${userId}`)
            if (res.ok) {
                const data = await res.json()
                setTasks(data.tasks || [])
            } else {
                // Fallback to mock data
                setTasks([
                    {
                        task_id: "1",
                        task_title: "Préparation pâte",
                        due_at: new Date().toISOString(),
                        items: [
                            { id: "101", text: "Farine pesée", is_done: true, due_at: null },
                            { id: "102", text: "Pétrissage", is_done: false, due_at: null },
                            { id: "103", text: "Repos", is_done: false, due_at: null },
                        ],
                    },
                    {
                        task_id: "2",
                        task_title: "Ouverture",
                        due_at: new Date().toISOString(),
                        items: [
                            { id: "201", text: "Panneaux parking", is_done: false, due_at: null },
                            { id: "202", text: "Blocs parking", is_done: false, due_at: null },
                        ],
                    },
                ])
            }
        } catch (error) {
            console.error("Error loading tasks:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const toggleItem = async (itemId: string, currentDone: boolean) => {
        try {
            const res = await fetch(`/api/checklist/${itemId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    is_done: !currentDone,
                    done_by: userId,
                }),
            })

            if (res.ok) {
                // Update local state
                setTasks(tasks.map(task => ({
                    ...task,
                    items: task.items.map(item =>
                        item.id === itemId ? { ...item, is_done: !currentDone } : item
                    )
                })))
            }
        } catch (error) {
            console.error("Error toggling item:", error)
        }
    }

    return (
        <div className="min-h-dvh bg-white pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-white px-4 shadow-sm">
                <div className="flex items-center space-x-3">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/select-user')} aria-label="戻る">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-bold text-balance">Bonjour, Maxime! 👋</h1>
                </div>
                <Badge variant="outline" className="text-xs">
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long' })}
                </Badge>
            </header>

            {/* Content */}
            <main className="p-4 space-y-6">
                {/* Business Calendar */}
                {businessDates.length > 0 && (
                    <BusinessCalendar businessDates={businessDates} />
                )}

                <div className="flex flex-col space-y-2">
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-balance">Aujourd'hui</h2>
                </div>

                {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground text-pretty">Chargement...</div>
                ) : (
                    <AnimatePresence>
                        {tasks.map((task) => {
                            const allDone = task.items.every(item => item.is_done)
                            return (
                                <motion.div
                                    key={task.task_id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="space-y-2"
                                >
                                    <Card className={allDone ? "opacity-60 bg-muted" : "border-l-4 border-l-primary"}>
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-base text-balance">{task.task_title}</CardTitle>
                                                    <CardDescription className="flex items-center text-xs text-pretty">
                                                        <Clock className="mr-1 h-3 w-3" />{" "}
                                                        <span className="tabular-nums">
                                                            {new Date(task.due_at).toLocaleTimeString("fr-FR", {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </span>
                                                    </CardDescription>
                                                </div>
                                                {!allDone && task.items.some(item => !item.is_done) && (
                                                    <Badge variant="secondary" className="animate-pulse">En cours</Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {task.items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => toggleItem(item.id, item.is_done)}
                                                        className={`flex items-center space-x-3 rounded-md p-3 sm:p-2 transition-colors active:bg-accent touch-manipulation min-h-[44px] ${item.is_done ? 'bg-muted/50' : 'hover:bg-muted/30'}`}
                                                    >
                                                        <Checkbox
                                                            id={`item-${item.id}`}
                                                            checked={item.is_done}
                                                            onCheckedChange={() => toggleItem(item.id, item.is_done)}
                                                            className="h-7 w-7 sm:h-6 sm:w-6 rounded-full touch-manipulation"
                                                        />
                                                        <label
                                                            htmlFor={`item-${item.id}`}
                                                            className={`flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-pretty touch-manipulation ${item.is_done ? 'line-through text-muted-foreground' : ''}`}
                                                        >
                                                            {item.text}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                )}

                {!isLoading && tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                        <Check className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-pretty">Bon travail! Rien à faire.</p>
                    </div>
                )}
            </main>
        </div>
    )
}
