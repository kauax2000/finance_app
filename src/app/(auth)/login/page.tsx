import { Suspense } from "react"
import { AppLogo } from "@/components/layout/app-logo"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <a href="#" className="flex items-center gap-2 self-center font-medium">
                    <AppLogo size="sm" showWordmark />
                </a>
                <Suspense
                    fallback={
                        <div
                            className="h-80 w-full animate-pulse rounded-xl border bg-card"
                            aria-hidden
                        />
                    }
                >
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    )
}
