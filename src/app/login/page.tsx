import { Suspense } from "react"
import LoginForm from "./login-form"

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-dvh items-center justify-center">
                <div className="text-muted-foreground text-pretty">読み込み中...</div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
