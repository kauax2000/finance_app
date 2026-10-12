import { Suspense } from "react"

import { RecoveryScene } from "@/components/auth/scenes/recovery-scene"
import { AuthFormSkeleton, AuthShell } from "@/components/layout/auth-shell"
import { PasswordRecoveryForm } from "@/components/password-recovery-form"

export default function ForgotPasswordPage() {
    return (
        <Suspense
            fallback={
                <AuthShell
                    title="Recuperar senha"
                    scene={<RecoveryScene step="email" />}
                >
                    <AuthFormSkeleton fields={1} />
                </AuthShell>
            }
        >
            <PasswordRecoveryForm entry="code" />
        </Suspense>
    )
}
