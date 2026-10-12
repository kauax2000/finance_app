import { Suspense } from "react"

import { LoginScene } from "@/components/auth/scenes/login-scene"
import { AuthFormSkeleton, AuthShell } from "@/components/layout/auth-shell"
import { LoginForm } from "@/components/login-form"

/**
 * A página é fina de propósito: quem monta o `AuthShell` é o formulário, que é
 * o único que sabe em que estado está — o cadastro troca o título ao mostrar
 * "Confirme seu e-mail", e a recuperação troca a cada passo.
 *
 * O `Suspense` continua obrigatório porque os formulários leem
 * `useSearchParams` (o parâmetro `next`), e sem ele a rota deixa de ser
 * pré-renderizável.
 */
export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <AuthShell
                    title="Entrar"
                    description="Bem-vindo de volta."
                    scene={<LoginScene />}
                >
                    <AuthFormSkeleton />
                </AuthShell>
            }
        >
            <LoginForm />
        </Suspense>
    )
}
