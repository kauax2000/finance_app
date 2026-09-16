"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { formatAuthErrorMessagePt } from "@/lib/supabase-errors"
import { getSafeInternalNextPath } from "@/lib/auth-return-path"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { CustomForm, FormInput } from "@/components/ui/form"
import { GoogleIcon } from "@/components/icons/google-icon"
import { Button } from "@/components/ui/button"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/16/solid"
import {
    Field,
    FieldControl,
    FieldError,
    FieldLabel,
} from "@/components/ui/field"

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FieldErrors {
    email?: string
    password?: string
}

function getFieldErrors(email: string, password: string): FieldErrors {
    const errors: FieldErrors = {}
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
        errors.email = "Email é obrigatório"
    } else if (!emailRegex.test(trimmedEmail)) {
        errors.email = "Digite um email válido"
    }

    if (!password.trim()) {
        errors.password = "Senha é obrigatória"
    }

    return errors
}

export function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const emailInputRef = useRef<HTMLInputElement>(null)
    const passwordInputRef = useRef<HTMLInputElement>(null)
    const nextRoute = useMemo(() => {
        const raw = searchParams.get("next")
        const safe = getSafeInternalNextPath(raw)
        return safe ?? "/dashboard"
    }, [searchParams])
    const registerHref = useMemo(() => {
        const raw = searchParams.get("next")
        const safe = getSafeInternalNextPath(raw)
        return safe ? `/register?next=${encodeURIComponent(safe)}` : "/register"
    }, [searchParams])
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

    const handleGoogleLogin = async () => {
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}${nextRoute}`,
            },
        })
        if (oauthError) {
            setError(formatAuthErrorMessagePt(oauthError.message))
        }
    }

    return (
        <div className="w-full rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col gap-6 p-6">
                {error ? (
                    <Alert tone="destructive" variant="plain">
                        <AlertTitle>{error}</AlertTitle>
                    </Alert>
                ) : null}
                <CustomForm onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
                    {/* `FormInput` liga rótulo, erro e `aria-describedby` sozinho:
                        o `id` e o `aria-invalid` que estavam aqui à mão saem, e o
                        erro deixa de ser um `<p>` solto que ninguém anunciava. */}
                    <FormInput
                        id="email"
                        ref={emailInputRef}
                        label="Email"
                        type="email"
                        placeholder="seu@email.com"
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
                            <Link
                                href="/forgot-password"
                                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                            >
                                Esqueceu a senha?
                            </Link>
                        </div>
                        <InputGroup>
                            <FieldControl>
                                <InputGroupInput
                                    id="password"
                                    ref={passwordInputRef}
                                    type={showPassword ? "text" : "password"}
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
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Entrando..." : "Entrar"}
                    </Button>
                </CustomForm>

                <div className="relative flex items-center gap-3 text-sm">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-muted-foreground">ou continue com</span>
                    <div className="h-px flex-1 bg-border" />
                </div>

                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    type="button"
                >
                    <GoogleIcon />
                    Google
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    Não tem uma conta?{" "}
                    <Link
                        href={registerHref}
                        className="text-primary-accent font-medium underline-offset-4 hover:underline"
                    >
                        Criar conta
                    </Link>
                </p>
            </div>
        </div>
    )
}
