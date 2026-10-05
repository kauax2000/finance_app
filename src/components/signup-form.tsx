"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { supabase } from "@/lib/supabase"
import { getSafeInternalNextPath } from "@/lib/auth-return-path"
import { isValidEmail } from "@/lib/email"
import { formatAuthErrorMessagePt } from "@/lib/supabase-errors"
import { isPasswordValid, passwordErrorMessage } from "@/lib/password-policy"
import { ROUTES } from "@/config/navigation"
import { PasswordRequirements } from "@/components/auth/password-requirements"
import { AuthShell } from "@/components/layout/auth-shell"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { SplitShellFooter } from "@/components/ui/split-shell"
import { Form, FormInput, FormSubmit } from "@/components/ui/form"
import {
    InputGroup,
    InputGroupInput,
    InputGroupPasswordToggle,
} from "@/components/ui/input-group"
import {
    Field,
    FieldControl,
    FieldError,
    FieldLabel,
} from "@/components/ui/field"

interface FieldErrors {
    fullName?: string
    email?: string
    password?: string
}

export function SignupForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const nextPath = useMemo(
        () => getSafeInternalNextPath(searchParams.get("next")),
        [searchParams]
    )
    const loginHref = useMemo(
        () =>
            nextPath
                ? `${ROUTES.LOGIN}?next=${encodeURIComponent(nextPath)}`
                : ROUTES.LOGIN,
        [nextPath]
    )
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [fullName, setFullName] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    const validateFields = (): boolean => {
        const errors: FieldErrors = {}

        if (!fullName.trim()) {
            errors.fullName = "Nome completo é obrigatório"
        }

        if (!email.trim()) {
            errors.email = "E-mail é obrigatório"
        } else if (!isValidEmail(email)) {
            errors.email = "Digite um e-mail válido"
        }

        // A política inteira mora em `lib/password-policy`, e a redefinição de
        // senha aplica exatamente a mesma — era o furo que deixava recuperar a
        // senha para uma que o cadastro teria recusado.
        errors.password = passwordErrorMessage(password)

        const cleaned = Object.fromEntries(
            Object.entries(errors).filter(([, value]) => value)
        ) as FieldErrors
        setFieldErrors(cleaned)
        return Object.keys(cleaned).length === 0
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setFieldErrors({})

        if (!validateFields()) {
            return
        }

        setLoading(true)

        const origin = typeof window !== "undefined" ? window.location.origin : ""
        const emailRedirectTo = `${origin}${nextPath ?? ROUTES.DASHBOARD}`

        const { data, error } = await supabase.auth.signUp({
            // Aparado, como no login. Sem isto dava para criar a conta num
            // endereço com espaço na ponta e depois não entrar nele, porque
            // o login manda a versão aparada.
            email: email.trim(),
            password,
            options: {
                // O telefone saiu daqui. Ele era obrigatório no formulário,
                // vinha com máscara brasileira e regex própria — e **nenhum
                // consumidor**: o trigger `handle_new_user` não o lê e nada em
                // `src/` o busca. Era atrito no cadastro em troca de um campo
                // que morria no metadata.
                data: { full_name: fullName },
                emailRedirectTo,
            },
        })

        if (error) {
            setError(formatAuthErrorMessagePt(error.message))
            setLoading(false)
        } else if (data.session) {
            // Lacuna 1 de `docs/JORNADAS.md`: com a confirmação de e-mail
            // desligada o `signUp` já volta com sessão — a pessoa **está
            // dentro**. A condição antes exigia também um `next`, então quem
            // chegava pelo caminho comum via "Confirme seu e-mail" depois de
            // já ter entrado.
            setLoading(false)
            router.push(nextPath ?? ROUTES.DASHBOARD)
        } else {
            setSuccess(true)
            setLoading(false)
        }
    }

    // O sucesso é **outra tela**, e por isso ele troca o título do casco em vez
    // de empilhar um segundo `<h1>` embaixo de "Criar conta". É o motivo de o
    // formulário, e não a página, montar o `AuthShell`: só ele sabe em que
    // estado está.
    if (success) {
        return (
            <AuthShell
                title="Confirme seu e-mail"
                step="confirm"
                description={
                    <>
                        Enviamos um link de confirmação para{" "}
                        <strong className="font-medium text-foreground">
                            {email}
                        </strong>
                        . Clique nele para ativar a conta.
                    </>
                }
            >
                {nextPath ? (
                    <Alert tone="info">
                        <AlertTitle>
                            Depois de confirmar, você volta para concluir o
                            convite. Se isso não acontecer, entre com o mesmo
                            e-mail — o convite continua esperando.
                        </AlertTitle>
                    </Alert>
                ) : null}

                <Button asChild variant="secondary" size="xl" className="w-full">
                    <Link href={loginHref}>Ir para o login</Link>
                </Button>
            </AuthShell>
        )
    }

    return (
        <AuthShell
            title="Criar conta"
            description="A carteira pessoal e as categorias já vêm prontas."
            step="form"
            footer={
                <SplitShellFooter>
                    <p>
                        Já tem uma conta? <Link href={loginHref}>Entrar</Link>
                    </p>
                </SplitShellFooter>
            }
        >
            <div className="flex flex-col gap-(--space-block)">
                {error ? (
                    <Alert tone="destructive">
                        <AlertTitle>{error}</AlertTitle>
                    </Alert>
                ) : null}
                <Form onSubmit={handleSignup} pending={loading} noValidate>
                    <FormInput
                        id="fullName"
                        size="xl"
                        label="Nome completo"
                        type="text"
                        autoComplete="name"
                        placeholder="Como você quer ser chamado"
                        value={fullName}
                        onChange={(e) => {
                            setFullName(e.target.value)
                            setError("")
                            if (fieldErrors.fullName) {
                                setFieldErrors(prev => ({ ...prev, fullName: undefined }))
                            }
                        }}
                        error={fieldErrors.fullName}
                    />
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
                    {/* `Field` composto, e não `FormInput`: o campo carrega o
                        botão de mostrar/ocultar e a lista viva de requisitos.
                        O `id` vai no `InputGroupInput`, nunca no grupo. */}
                    <Field>
                        <FieldLabel>Senha</FieldLabel>
                        <InputGroup size="xl">
                            <FieldControl>
                                <InputGroupInput
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Crie uma senha"
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
                        {/* O erro só aparece depois do envio; enquanto a pessoa
                            digita, quem fala é a lista — dizer "falta símbolo"
                            em vermelho na terceira tecla é ruído. */}
                        {fieldErrors.password ? (
                            <FieldError>{fieldErrors.password}</FieldError>
                        ) : null}
                        {!fieldErrors.password && !isPasswordValid(password) ? (
                            <PasswordRequirements password={password} />
                        ) : null}
                    </Field>
                    <FormSubmit size="xl" className="w-full">
                        Criar conta
                    </FormSubmit>
                </Form>
            </div>
        </AuthShell>
    )
}
