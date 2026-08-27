import { AppWordmark } from "@/components/layout/app-wordmark"
import { ForgotPasswordForm } from "@/components/forgot-password-form"

export default function ForgotPasswordPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <a href="#" className="flex items-center gap-2 self-center">
                    <AppWordmark size="lg" />
                </a>
                <ForgotPasswordForm />
            </div>
        </div>
    )
}
