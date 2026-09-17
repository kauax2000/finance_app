import { Suspense } from "react"

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
                    description="Uma conta, todas as suas carteiras."
                >
                    <AuthFormSkeleton />
                </AuthShell>
            }
        >
            <LoginForm />
        </Suspense>
    )
}
