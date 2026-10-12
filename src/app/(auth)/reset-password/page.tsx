import { Suspense } from "react"

import { RecoveryScene } from "@/components/auth/scenes/recovery-scene"
import { AuthFormSkeleton, AuthShell } from "@/components/layout/auth-shell"
import { PasswordRecoveryForm } from "@/components/password-recovery-form"

/**
 * A porta do **link de e-mail**. Ela monta o mesmo formulário de
 * `/forgot-password`, já no passo da senha nova, lendo os tokens do hash.
 *
 * Ela existe porque o template de e-mail do Supabase vive fora deste
 * repositório e pode mandar link em vez de código. Antes eram duas
 * implementações divergentes desta mesma tela; agora é uma, com duas entradas.
 */
export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <AuthShell
                    title="Nova senha"
                    scene={<RecoveryScene step="password" />}
                >
                    <AuthFormSkeleton fields={1} />
                </AuthShell>
            }
        >
            <PasswordRecoveryForm entry="link" />
        </Suspense>
    )
}
