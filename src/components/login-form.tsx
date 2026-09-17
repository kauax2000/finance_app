"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/16/solid"

import { supabase } from "@/lib/supabase"
import { formatAuthErrorMessagePt } from "@/lib/supabase-errors"
import { getSafeInternalNextPath } from "@/lib/auth-return-path"
import { isValidEmail } from "@/lib/email"
import { ROUTES } from "@/config/navigation"
import { AuthShell } from "@/components/layout/auth-shell"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Form, FormInput, FormSubmit } from "@/components/ui/form"
import { Muted } from "@/components/ui/typography"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group"
import {
    Field,
    FieldControl,
    FieldError,
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
const REASONS: Record<string, string> = {
    "session-expired":
        "Sua sessão foi encerrada. Entre de novo para continuar de onde parou.",
    "password-updated": "Senha atualizada. Entre com a senha nova.",
}

export function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const emailInputRef = useRef<HTMLInputElement>(null)
    const passwordInputRef = useRef<HTMLInputElement>(null)
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
    const reason = REASONS[searchParams.get("reason") ?? ""]
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        const errors = getFieldErrors(email, password)
        setFieldErrors(errors)

        if (Object.keys(errors).length > 0) {
            if (errors.email) {
                emailInputRef.current?.focus()
            } else {
                passwordInputRef.current?.focus()
            }
            return
        }

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
            title="Entrar"
            description="Uma conta, todas as suas carteiras."
        >
            <div className="flex flex-col gap-(--space-block)">
                {reason && !error ? (
                    <Alert tone="info" variant="plain">
                        <AlertTitle>{reason}</AlertTitle>
                    </Alert>
                ) : null}
                {error ? (
                    <Alert tone="destructive" variant="plain">
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
                        ref={emailInputRef}
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
                        <div className="flex items-center justify-between gap-2">
                            <FieldLabel>Senha</FieldLabel>
                            {/* Sublinhado **sempre**, não só no cursor: é o
                                link que alguém procura justamente por estar
                                travado, e sem traço ele era a coisa menos
                                visível da tela. E ele carrega o `next`, como
                                todos os outros — quem redefine a senha também
                                está voltando para algum lugar. */}
                            <Link
                                href={forgotHref}
                                className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground active:text-foreground"
                            >
                                Esqueceu a senha?
                            </Link>
                        </div>
                        <InputGroup size="xl">
                            <FieldControl>
                                <InputGroupInput
                                    id="password"
                                    ref={passwordInputRef}
                                    type={showPassword ? "text" : "password"}
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
                            <InputGroupAddon align="inline-end">
                                <InputGroupButton
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                </InputGroupButton>
                            </InputGroupAddon>
                        </InputGroup>
                        {fieldErrors.password ? (
                            <FieldError>{fieldErrors.password}</FieldError>
                        ) : null}
                    </Field>
                    <FormSubmit size="xl" className="w-full" pendingLabel="Entrando…">
                        Entrar
                    </FormSubmit>
                </Form>
            </div>

            <Muted>
                Não tem uma conta?{" "}
                <Link
                    href={registerHref}
                    className="font-medium text-primary-accent underline-offset-4 hover:underline active:underline"
                >
                    Criar conta
                </Link>
            </Muted>
        </AuthShell>
    )
}
