import { Suspense } from "react"

import { LoginScene } from "@/components/auth/scenes/login-scene"
import { AuthFormSkeleton, AuthShell } from "@/components/layout/auth-shell"
import { SignupForm } from "@/components/signup-form"

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <AuthShell
                    title="Criar conta"
                    description="A carteira pessoal e as categorias já vêm prontas."
                    scene={<LoginScene />} // TODO Tarefa 5: RegisterScene
                >
                    <AuthFormSkeleton fields={3} />
                </AuthShell>
            }
        >
            <SignupForm />
        </Suspense>
    )
}
