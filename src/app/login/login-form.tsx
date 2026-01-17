"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ユーザーとパスコードのマッピング
const USER_PASSCODES: Record<string, { id: string; name: string; role: string; redirectPath: string }> = {
    "1234": { id: "kaori", name: "Kaori", role: "店長 (Admin)", redirectPath: "/dashboard" },
    "5678": { id: "mai", name: "Mai", role: "共同管理者", redirectPath: "/dashboard" },
    "9012": { id: "maxime", name: "Maxime", role: "スタッフ", redirectPath: "/tasks/my" },
}

export default function LoginForm() {
    const router = useRouter()
    const [passcode, setPasscode] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        // Simulate delay
        await new Promise((resolve) => setTimeout(resolve, 800))

        const user = USER_PASSCODES[passcode]

        if (user) {
            // TODO: Set user session cookie via API
            // セッションにユーザーIDを保存（将来的にはCookieやSupabaseセッションを使用）
            if (typeof window !== "undefined") {
                sessionStorage.setItem("userId", user.id)
                sessionStorage.setItem("userName", user.name)
            }
            
            router.push(user.redirectPath)
        } else {
            setError("パスコードが正しくありません")
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-dvh items-center justify-center bg-white p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
            >
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center pb-2">
                            <Image src="/logo.svg" alt="moi" width={64} height={64} className="h-16 w-auto" priority />
                        </div>
                        <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-primary text-balance">moi Task</CardTitle>
                        <CardDescription className="text-base sm:text-sm text-pretty">
                            パスコードを入力してください
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="passcode" className="sr-only">パスコード</Label>
                                <Input
                                    id="passcode"
                                    type="password"
                                    placeholder="••••"
                                    className="text-center text-2xl sm:text-lg tracking-widest h-14 sm:h-12"
                                    value={passcode}
                                    onChange={(e) => {
                                        setPasscode(e.target.value)
                                        setError("") // 入力時にエラーをクリア
                                    }}
                                    maxLength={4}
                                    required
                                    autoFocus
                                />
                            </div>
                            {error && (
                                <p className="text-center text-base sm:text-sm text-destructive text-pretty">{error}</p>
                            )}
                            <Button type="submit" className="w-full h-12 sm:h-10 text-base sm:text-sm" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 sm:h-4 sm:w-4 animate-spin" /> : "ログイン"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
