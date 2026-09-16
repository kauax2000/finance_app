"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { formatAuthErrorMessagePt } from "@/lib/supabase-errors"
import { getSafeInternalNextPath } from "@/lib/auth-return-path"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { CustomForm } from "@/components/ui/form"
import { GoogleIcon } from "@/components/icons/google-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/16/solid"
import { Label } from "@/components/ui/label"

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
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            ref={emailInputRef}
                            id="email"
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
                            aria-invalid={!!fieldErrors.email}
                            aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                            className={fieldErrors.email ? "border-destructive" : ""}
                        />
                        {fieldErrors.email ? (
                            <p
                                id="login-email-error"
                                className="text-control-sm font-medium text-destructive"
                            >
                                {fieldErrors.email}
                            </p>
                        ) : null}
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Senha</Label>
                            <Link
                                href="/forgot-password"
                                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                            >
                                Esqueceu a senha?
                            </Link>
                        </div>
                        <InputGroup aria-invalid={!!fieldErrors.password}>
                            <InputGroupInput
                                ref={passwordInputRef}
                                id="password"
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
                                aria-invalid={!!fieldErrors.password}
                                aria-describedby={
                                    fieldErrors.password ? "login-password-error" : undefined
                                }
                            />
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
                            <p
                                id="login-password-error"
                                className="text-control-sm font-medium text-destructive"
                            >
                                {fieldErrors.password}
                            </p>
                        ) : null}
                    </div>
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
