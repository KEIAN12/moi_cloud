"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User, ShieldCheck, ChefHat } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const USERS = [
    { id: "kaori", name: "Kaori", role: "店長 (Admin)", icon: ShieldCheck, color: "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-200" },
    { id: "mai", name: "Mai", role: "共同管理者", icon: User, color: "bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-200" },
    { id: "maxime", name: "Maxime", role: "スタッフ", icon: ChefHat, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-200" },
]

export default function SelectUserPage() {
    const router = useRouter()

    const handleSelectUser = (userId: string) => {
        // ユーザー選択後、ログイン画面に遷移
        router.push(`/login?user=${userId}`)
    }

    return (
        <div className="flex min-h-dvh items-center justify-center bg-white p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                className="w-full max-w-2xl"
            >
                <Card className="shadow-xl border-0 bg-white/95 backdrop-blur">
                    <CardHeader className="text-center space-y-4 px-4 sm:px-6 pt-6">
                        <div className="flex justify-center pb-2">
                            <img src="/logo.svg" alt="moi" className="h-16 sm:h-20 w-auto" />
                        </div>
                        <CardTitle className="text-xl sm:text-2xl font-bold text-balance">担当者を選択</CardTitle>
                        <CardDescription className="text-sm sm:text-base text-pretty">
                            あなたのユーザーを選択してください
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 p-4 sm:p-6 grid-cols-1 sm:grid-cols-3">
                        {USERS.map((user) => (
                            <motion.button
                                key={user.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => handleSelectUser(user.id)}
                                className={`flex flex-col items-center justify-center space-y-4 rounded-xl border p-6 sm:p-5 transition-all hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/20 active:scale-95 ${user.color} border-transparent bg-gray-50/50 hover:bg-white min-h-[160px] sm:min-h-0`}
                            >
                                <div className={`rounded-full p-4 sm:p-3 shadow-sm ${user.color.split(' ')[0]} bg-white`}>
                                    <user.icon className="h-12 w-12 sm:h-10 sm:w-10" />
                                </div>
                                <div className="space-y-1 text-center">
                                    <h3 className="font-bold text-lg sm:text-base text-foreground text-balance">{user.name}</h3>
                                    <p className="text-sm sm:text-xs text-muted-foreground text-pretty">{user.role}</p>
                                </div>
                            </motion.button>
                        ))}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
