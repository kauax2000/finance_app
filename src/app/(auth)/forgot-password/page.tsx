import { Suspense } from "react"

import { AuthFormSkeleton, AuthShell } from "@/components/layout/auth-shell"
import { PasswordRecoveryForm } from "@/components/password-recovery-form"

export default function ForgotPasswordPage() {
    return (
        <Suspense
            fallback={
                <AuthShell scene="recovery.email" title="Recuperar senha">
                    <AuthFormSkeleton fields={1} />
                </AuthShell>
            }
        >
            <PasswordRecoveryForm entry="code" />
        </Suspense>
    )
}
