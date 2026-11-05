import { Suspense } from "react"

import { AuthFormSkeleton, AuthShell } from "@/components/layout/auth-shell"
import { PasswordRecoveryForm } from "@/components/password-recovery-form"

/**
 * A porta do **link de e-mail**: onde cai o link que `/forgot-password` pediu.
 * Monta o mesmo formulário, já no passo da senha nova, lendo os tokens do
 * endereço.
 */
export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <AuthShell scene="recovery.link-checking" title="Nova senha">
                    <AuthFormSkeleton fields={1} />
                </AuthShell>
            }
        >
            <PasswordRecoveryForm entry="link" />
        </Suspense>
    )
}
