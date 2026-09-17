import { Suspense } from "react"

import { AuthFormSkeleton, AuthShell } from "@/components/layout/auth-shell"
import { SignupForm } from "@/components/signup-form"

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <AuthShell
                    title="Criar conta"
                    description="A carteira pessoal e as categorias já vêm prontas."
                >
                    <AuthFormSkeleton fields={3} />
                </AuthShell>
            }
        >
            <SignupForm />
        </Suspense>
    )
}
