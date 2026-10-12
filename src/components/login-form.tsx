"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { supabase } from "@/lib/supabase"
import { formatAuthErrorMessagePt } from "@/lib/supabase-errors"
import { getSafeInternalNextPath } from "@/lib/auth-return-path"
import { isValidEmail } from "@/lib/email"
import { ROUTES } from "@/config/navigation"
import { AuthShell } from "@/components/layout/auth-shell"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Form, FormInput, FormSubmit } from "@/components/ui/form"
import { SplitShellFooter } from "@/components/ui/split-shell"
import {
    InputGroup,
    InputGroupInput,
    InputGroupPasswordToggle,
} from "@/components/ui/input-group"
import {
    Field,
    FieldControl,
    FieldError,
    FieldHeader,
    FieldLabel,
} from "@/components/ui/field"

interface FieldErrors {
    email?: string
    password?: string
}

function getFieldErrors(email: string, password: string): FieldErrors {
    const errors: FieldErrors = {}
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
        errors.email = "E-mail é obrigatório"
    } else if (!isValidEmail(trimmedEmail)) {
        errors.email = "Digite um e-mail válido"
    }

    if (!password.trim()) {
        errors.password = "Senha é obrigatória"
    }

    return errors
}

/**
 * O motivo pelo qual a pessoa caiu aqui, quando não foi ela que pediu.
 *
 * A sessão encerrada em outro aparelho limpa tudo e deixa o `AuthGuard`
 * redirecionar — o que funcionava, mas devolvia uma tela de login sem
 * explicação nenhuma no lugar da página em que a pessoa estava.
 */
const REASONS = {
    "session-expired":
        "Sua sessão foi encerrada. Entre de novo para continuar de onde parou.",
    "password-updated": "Senha atualizada. Entre com a senha nova.",
} as const

type Reason = keyof typeof REASONS

const isReason = (value: string | null): value is Reason =>
    value !== null && Object.hasOwn(REASONS, value)

export function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const nextRoute = useMemo(() => {
        const raw = searchParams.get("next")
        const safe = getSafeInternalNextPath(raw)
        return safe ?? ROUTES.DASHBOARD
    }, [searchParams])
    const forgotHref = useMemo(() => {
        const raw = searchParams.get("next")
        const safe = getSafeInternalNextPath(raw)
        return safe
            ? `${ROUTES.FORGOT_PASSWORD}?next=${encodeURIComponent(safe)}`
            : ROUTES.FORGOT_PASSWORD
    }, [searchParams])
    const registerHref = useMemo(() => {
        const raw = searchParams.get("next")
        const safe = getSafeInternalNextPath(raw)
        return safe
            ? `${ROUTES.REGISTER}?next=${encodeURIComponent(safe)}`
            : ROUTES.REGISTER
    }, [searchParams])
    const rawReason = searchParams.get("reason")
    const reason = isReason(rawReason) ? rawReason : undefined
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        const errors = getFieldErrors(email, password)
        setFieldErrors(errors)

        // O foco no primeiro erro é do `Form`: os dois campos carregam
        // `aria-invalid` quando têm erro (o `FormInput` pelo `error`, a senha
        // pelo `FieldError`), e ele foca o primeiro depois do envio.
        if (Object.keys(errors).length > 0) return

        setLoading(true)

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        })

        if (signInError) {
            setError(formatAuthErrorMessagePt(signInError.message))
            setLoading(false)
        } else {
            router.push(nextRoute)
        }
    }

    return (
        <AuthShell
            scene={reason ? `login.${reason}` : "login"}
            title="Entrar"
            description="Bem-vindo de volta."
            step={reason ?? "default"}
            footer={
                <SplitShellFooter>
                    <p>
                        Não tem uma conta?{" "}
                        <Link href={registerHref}>Criar conta</Link>
                    </p>
                </SplitShellFooter>
            }
        >
            <div className="flex flex-col gap-(--space-block)">
                {reason && !error ? (
                    <Alert tone="info">
                        <AlertTitle>{REASONS[reason]}</AlertTitle>
                    </Alert>
                ) : null}
                {error ? (
                    <Alert tone="destructive">
                        <AlertTitle>{error}</AlertTitle>
                    </Alert>
                ) : null}
                {/* `Form` com `pending` é a forma curta: o `FormSubmit` lá
                    embaixo desabilita, marca `aria-busy` e troca o rótulo
                    sozinho. Antes isso era `CustomForm` mais um `Button` com
                    `disabled={loading}` e um ternário no texto. */}
                <Form onSubmit={handleLogin} pending={loading} noValidate>
                    {/* `FormInput` liga rótulo, erro e `aria-describedby`
                        sozinho. O `id="email"` é contrato: `e2e/auth.setup.ts`
                        seleciona por ele. */}
                    <FormInput
                        id="email"
                        size="xl"
                        label="E-mail"
                        type="email"
                        autoComplete="email"
                        placeholder="voce@email.com"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value)
                            setError("")
                            if (fieldErrors.email) {
                                setFieldErrors(prev => ({ ...prev, email: undefined }))
                            }
                        }}
                        error={fieldErrors.email}
                    />
                    {/* O rótulo divide a linha com o link de recuperar senha, então
                        aqui é `Field` composto em vez de `FormInput` — e o embrulho
                        vai no `InputGroupInput`, nunca no grupo: o `id` numa `div`
                        deixa o `<label for>` apontando para algo que não é
                        rotulável. */}
                    <Field>
                        <FieldHeader>
                            <FieldLabel>Senha</FieldLabel>
                            <Button asChild variant="link" size="sm">
                                <Link href={forgotHref}>Esqueceu a senha?</Link>
                            </Button>
                        </FieldHeader>
                        <InputGroup size="xl">
                            <FieldControl>
                                <InputGroupInput
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="Digite sua senha"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        setError("")
                                        if (fieldErrors.password) {
                                            setFieldErrors(prev => ({ ...prev, password: undefined }))
                                        }
                                    }}
                                />
                            </FieldControl>
                            <InputGroupPasswordToggle />
                        </InputGroup>
                        {fieldErrors.password ? (
                            <FieldError>{fieldErrors.password}</FieldError>
                        ) : null}
                    </Field>
                    <FormSubmit size="xl" className="w-full">
                        Entrar
                    </FormSubmit>
                </Form>
            </div>
        </AuthShell>
    )
}
